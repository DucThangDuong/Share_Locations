using System.IO.Compression;
using System.Security.Cryptography;
using System.Text.Json;
using Application.Common.Interfaces;
using Infrastructure.Caching.Configuration;
using Infrastructure.Caching.Connection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using StackExchange.Redis;

namespace Infrastructure.Caching.Services;

public sealed class EnterpriseRedisService : IEnterpriseCacheService
{
    private readonly IRedisConnectionProvider _connectionProvider;
    private readonly RedisOptions _options;
    private readonly ILogger<EnterpriseRedisService> _logger;

    // Chống rò rỉ bộ nhớ (OOM): Sử dụng mảng Striped Locks 2048 phần tử cố định
    // Đảm bảo mức tiêu thụ RAM luôn là hằng số O(1), không bị phình to vô hạn như ConcurrentDictionary
    private const int StripeCount = 2048;
    private static readonly SemaphoreSlim[] StripedLocks = Enumerable.Range(0, StripeCount)
        .Select(_ => new SemaphoreSlim(1, 1))
        .ToArray();

    private const string NullSentinel = "__ENTERPRISE_NULL_SENTINEL__";
    private static readonly byte[] CompressedPrefix = "BR1:"u8.ToArray();
    private static readonly byte[] RawPrefix = "RAW:"u8.ToArray();

    private static readonly JsonSerializerOptions SafeJsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        MaxDepth = 32 // Chống tấn công JSON lồng nhau quá sâu (Deep Recursion DoS)
    };

    // LUA SCRIPT 1: Mở khóa phân tán an toàn tuyệt đối (Chống Race Condition / TOCTOU khi hết hạn khóa)
    // Chỉ xóa khóa bằng lệnh UNLINK nếu giá trị lưu trong Redis khớp chính xác với mã chủ sở hữu (lockToken)
    private const string SafeUnlockLuaScript = """
        if redis.call('GET', KEYS[1]) == ARGV[1] then
            return redis.call('UNLINK', KEYS[1])
        else
            return 0
        end
        """;

    // LUA SCRIPT 2: Sliding Window Rate Limiter nguyên tử (Chống Brute-Force OTP, DDoS & BOLA)
    private const string SlidingWindowRateLimitLuaScript = """
        local key = KEYS[1]
        local now_ms = tonumber(ARGV[1])
        local window_ms = tonumber(ARGV[2])
        local max_permits = tonumber(ARGV[3])
        local request_id = ARGV[4]

        redis.call('ZREMRANGEBYSCORE', key, '-inf', now_ms - window_ms)
        local current_count = redis.call('ZCARD', key)

        if current_count >= max_permits then
            return 0
        end

        redis.call('ZADD', key, now_ms, request_id)
        redis.call('PEXPIRE', key, window_ms)
        return 1
        """;

    public EnterpriseRedisService(
        IRedisConnectionProvider connectionProvider,
        IOptions<RedisOptions> options,
        ILogger<EnterpriseRedisService> logger)
    {
        _connectionProvider = connectionProvider;
        _options = options.Value;
        _logger = logger;
    }

    private static SemaphoreSlim GetStripeLock(string fullKey)
    {
        uint hash = unchecked((uint)fullKey.GetHashCode());
        return StripedLocks[hash % StripeCount];
    }

    public async Task<T?> GetOrCreateAsync<T>(
        string rawKey,
        Func<CancellationToken, Task<T?>> factory,
        TimeSpan baseTtl,
        CancellationToken ct = default)
    {
        string fullKey = BuildSafeKey(rawKey);

        // 1. Thử đọc từ Redis trước
        var cachedResult = await TryGetInternalAsync<T>(fullKey, ct).ConfigureAwait(false);
        if (cachedResult.Found)
            return cachedResult.Value;

        // 2. Chống Cache Stampede: Dùng Striped Lock cục bộ
        var stripeLock = GetStripeLock(fullKey);
        await stripeLock.WaitAsync(ct).ConfigureAwait(false);
        try
        {
            // Kiểm tra lại lần 2 (Double-checked locking) sau khi giành được khóa
            cachedResult = await TryGetInternalAsync<T>(fullKey, ct).ConfigureAwait(false);
            if (cachedResult.Found)
                return cachedResult.Value;

            // 3. Gọi xuống Database lấy dữ liệu
            T? dbValue = await factory(ct).ConfigureAwait(false);

            // 4. Chống Cache Penetration: Nếu Database trả về null, lưu giá trị đánh dấu trong 45 giây
            if (dbValue is null)
            {
                await _connectionProvider.ExecuteWithResilienceAsync(
                    db => db.StringSetAsync(fullKey, NullSentinel, TimeSpan.FromSeconds(45)),
                    fallbackValue: false,
                    failOpen: _options.FailOpenOnCacheError,
                    ct: ct).ConfigureAwait(false);
                return default;
            }

            // 5. Chống Cache Avalanche: Cộng thêm độ lệch ngẫu nhiên (Jitter +-10%) vào TTL
            TimeSpan jitteredTtl = ApplyTtlJitter(baseTtl);
            await SetSerializedValueAsync(fullKey, dbValue, jitteredTtl, ct).ConfigureAwait(false);

            return dbValue;
        }
        finally
        {
            stripeLock.Release();
        }
    }

    public async Task<T?> GetAsync<T>(string rawKey, CancellationToken ct = default)
    {
        string fullKey = BuildSafeKey(rawKey);
        var cachedResult = await TryGetInternalAsync<T>(fullKey, ct).ConfigureAwait(false);
        return cachedResult.Found ? cachedResult.Value : default;
    }

    public async Task<bool> SetAsync<T>(string rawKey, T value, TimeSpan ttl, CancellationToken ct = default)
    {
        string fullKey = BuildSafeKey(rawKey);

        if (value is null)
        {
            return await _connectionProvider.ExecuteWithResilienceAsync(
                db => db.StringSetAsync(fullKey, NullSentinel, TimeSpan.FromSeconds(45)),
                fallbackValue: false,
                failOpen: _options.FailOpenOnCacheError,
                ct: ct).ConfigureAwait(false);
        }

        TimeSpan jitteredTtl = ApplyTtlJitter(ttl);
        return await SetSerializedValueAsync(fullKey, value, jitteredTtl, ct).ConfigureAwait(false);
    }

    public async Task<bool> UnlinkKeyAsync(string rawKey, CancellationToken ct = default)
    {
        string fullKey = BuildSafeKey(rawKey);
        return await _connectionProvider.ExecuteWithResilienceAsync(
            async db =>
            {
                var res = await db.ExecuteAsync("UNLINK", fullKey).ConfigureAwait(false);
                return (int)res > 0;
            },
            fallbackValue: false,
            failOpen: _options.FailOpenOnCacheError,
            ct: ct).ConfigureAwait(false);
    }

    /// <summary>
    /// Xóa cache theo mẫu mà KHÔNG BAO GIỜ gọi lệnh KEYS * làm treo Redis đơn luồng.
    /// Sử dụng SCAN theo từng batch nhỏ và gọi UNLINK bất đồng bộ.
    /// </summary>
    public async Task<long> RemoveByPatternAsync(string pattern, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(pattern))
            return 0;

        string sanitizedPattern = pattern.Trim();
        string fullPattern = sanitizedPattern.StartsWith(_options.InstanceKeyPrefix, StringComparison.Ordinal)
            ? sanitizedPattern
            : $"{_options.InstanceKeyPrefix}{sanitizedPattern}";

        long deletedCount = 0;

        return await _connectionProvider.ExecuteWithResilienceAsync(
            async db =>
            {
                var endpoints = _connectionProvider.GetEndPoints();
                foreach (var endpoint in endpoints)
                {
                    ct.ThrowIfCancellationRequested();
                    var server = _connectionProvider.GetServer(endpoint);
                    if (!server.IsConnected) continue;

                    var batch = new List<RedisKey>(100);
                    foreach (var key in server.Keys(pattern: fullPattern, pageSize: 250))
                    {
                        ct.ThrowIfCancellationRequested();
                        batch.Add(key);

                        if (batch.Count >= 100)
                        {
                            var keysArray = batch.Select(k => (object)k.ToString()!).ToArray();
                            await db.ExecuteAsync("UNLINK", keysArray).ConfigureAwait(false);
                            deletedCount += batch.Count;
                            batch.Clear();
                        }
                    }

                    if (batch.Count > 0)
                    {
                        var keysArray = batch.Select(k => (object)k.ToString()!).ToArray();
                        await db.ExecuteAsync("UNLINK", keysArray).ConfigureAwait(false);
                        deletedCount += batch.Count;
                        batch.Clear();
                    }
                }

                return deletedCount;
            },
            fallbackValue: 0L,
            failOpen: _options.FailOpenOnCacheError,
            ct: ct).ConfigureAwait(false);
    }

    public async Task<IAsyncDisposable?> TryAcquireDistributedLockAsync(
        string resourceName,
        TimeSpan expiry,
        CancellationToken ct = default)
    {
        string lockKey = BuildSafeKey($"lock:{resourceName}");
        string lockToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(16));

        bool acquired = await _connectionProvider.ExecuteWithResilienceAsync(
            db => db.StringSetAsync(lockKey, lockToken, expiry, When.NotExists),
            fallbackValue: false,
            failOpen: false,
            ct: ct).ConfigureAwait(false);

        if (!acquired)
            return null;

        return new RedisDistributedLockHandle(_connectionProvider, lockKey, lockToken, _logger);
    }

    public async Task<bool> IsAllowedByRateLimitAsync(
        string subjectId,
        int maxPermits,
        TimeSpan window,
        CancellationToken ct = default)
    {
        string rateKey = BuildSafeKey($"ratelimit:{subjectId}");
        long nowMs = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        long windowMs = (long)window.TotalMilliseconds;
        string reqId = Guid.NewGuid().ToString("N");

        return await _connectionProvider.ExecuteWithResilienceAsync(
            async db =>
            {
                var result = await db.ScriptEvaluateAsync(
                    SlidingWindowRateLimitLuaScript,
                    keys: [rateKey],
                    values: [nowMs, windowMs, maxPermits, reqId]).ConfigureAwait(false);

                return (int)result == 1;
            },
            fallbackValue: _options.FailOpenOnRateLimitError,
            failOpen: _options.FailOpenOnRateLimitError,
            ct: ct).ConfigureAwait(false);
    }

    private async Task<(bool Found, T? Value)> TryGetInternalAsync<T>(string fullKey, CancellationToken ct)
    {
        RedisValue redisVal = await _connectionProvider.ExecuteWithResilienceAsync(
            db => db.StringGetAsync(fullKey),
            fallbackValue: RedisValue.Null,
            failOpen: _options.FailOpenOnCacheError,
            ct: ct).ConfigureAwait(false);

        if (redisVal.IsNullOrEmpty)
            return (false, default);

        if (redisVal == NullSentinel)
            return (true, default);

        try
        {
            byte[] rawBytes = (byte[])redisVal!;
            T? deserialized = DeserializePayload<T>(rawBytes);
            return (true, deserialized);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi giải mã dữ liệu Cache tại Key '{Key}'. Tiến hành UNLINK key hỏng.", fullKey);
            _ = UnlinkKeyAsync(fullKey, CancellationToken.None);
            return (false, default);
        }
    }

    private static T? DeserializePayload<T>(byte[] rawBytes)
    {
        if (rawBytes.AsSpan().StartsWith(CompressedPrefix))
        {
            using var inputStream = new MemoryStream(rawBytes, CompressedPrefix.Length, rawBytes.Length - CompressedPrefix.Length);
            using var brotli = new BrotliStream(inputStream, CompressionMode.Decompress);
            using var outputStream = new MemoryStream();
            brotli.CopyTo(outputStream);
            return JsonSerializer.Deserialize<T>(outputStream.ToArray(), SafeJsonOptions);
        }

        ReadOnlySpan<byte> payloadSpan = rawBytes.AsSpan().StartsWith(RawPrefix)
            ? rawBytes.AsSpan(RawPrefix.Length)
            : rawBytes;

        return JsonSerializer.Deserialize<T>(payloadSpan, SafeJsonOptions);
    }

    private async Task<bool> SetSerializedValueAsync<T>(string fullKey, T value, TimeSpan ttl, CancellationToken ct)
    {
        byte[] jsonBytes = JsonSerializer.SerializeToUtf8Bytes(value, SafeJsonOptions);
        byte[] finalPayload;

        if (jsonBytes.Length >= _options.CompressionThresholdBytes)
        {
            using var outputStream = new MemoryStream();
            outputStream.Write(CompressedPrefix);
            using (var brotli = new BrotliStream(outputStream, CompressionLevel.Fastest, leaveOpen: true))
            {
                brotli.Write(jsonBytes);
            }
            finalPayload = outputStream.ToArray();
        }
        else
        {
            finalPayload = new byte[RawPrefix.Length + jsonBytes.Length];
            Buffer.BlockCopy(RawPrefix, 0, finalPayload, 0, RawPrefix.Length);
            Buffer.BlockCopy(jsonBytes, 0, finalPayload, RawPrefix.Length, jsonBytes.Length);
        }

        if (finalPayload.Length > _options.MaxAllowedPayloadBytes)
        {
            _logger.LogWarning(
                "Từ chối lưu Key '{Key}' vào Redis vì kích thước ({Size} bytes) vượt ngưỡng an toàn ({Max} bytes).",
                fullKey, finalPayload.Length, _options.MaxAllowedPayloadBytes);
            return false;
        }

        return await _connectionProvider.ExecuteWithResilienceAsync(
            db => db.StringSetAsync(fullKey, finalPayload, ttl),
            fallbackValue: false,
            failOpen: _options.FailOpenOnCacheError,
            ct: ct).ConfigureAwait(false);
    }

    private string BuildSafeKey(string rawKey)
    {
        if (string.IsNullOrWhiteSpace(rawKey))
            throw new ArgumentException("Tên Key Redis không được để trống.", nameof(rawKey));

        string sanitized = rawKey.Trim().Replace(' ', '_').Replace('\r', '_').Replace('\n', '_');
        return sanitized.StartsWith(_options.InstanceKeyPrefix, StringComparison.Ordinal)
            ? sanitized
            : $"{_options.InstanceKeyPrefix}{sanitized}";
    }

    private static TimeSpan ApplyTtlJitter(TimeSpan baseTtl)
    {
        double jitterFactor = 0.90 + (RandomNumberGenerator.GetInt32(0, 2001) / 10000.0);
        double seconds = Math.Max(5.0, baseTtl.TotalSeconds * jitterFactor);
        return TimeSpan.FromSeconds(seconds);
    }

    private sealed class RedisDistributedLockHandle : IAsyncDisposable
    {
        private readonly IRedisConnectionProvider _provider;
        private readonly string _lockKey;
        private readonly string _lockToken;
        private readonly ILogger _logger;
        private int _released;

        public RedisDistributedLockHandle(
            IRedisConnectionProvider provider,
            string lockKey,
            string lockToken,
            ILogger logger)
        {
            _provider = provider;
            _lockKey = lockKey;
            _lockToken = lockToken;
            _logger = logger;
        }

        public async ValueTask DisposeAsync()
        {
            if (Interlocked.Exchange(ref _released, 1) == 1)
                return;

            try
            {
                await _provider.ExecuteWithResilienceAsync(
                    async db =>
                    {
                        var res = await db.ScriptEvaluateAsync(
                            SafeUnlockLuaScript,
                            keys: [_lockKey],
                            values: [_lockToken]).ConfigureAwait(false);
                        return (int)res == 1;
                    },
                    fallbackValue: false,
                    failOpen: false).ConfigureAwait(false);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Không thể giải phóng khóa phân tán '{LockKey}' (khóa sẽ tự hết hạn theo TTL).", _lockKey);
            }
        }
    }
}
