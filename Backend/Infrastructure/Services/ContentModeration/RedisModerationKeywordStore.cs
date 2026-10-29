using System.Text.Json;
using Application.Common.Interfaces;
using Infrastructure.Caching.Connection;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace Infrastructure.Services.ContentModeration;

/// <summary>
/// Kho lưu trữ từ cấm và mẫu lọc spam động 100% trên Redis Cache
/// Tuyệt đối KHÔNG hardcode bất kỳ từ ngữ nào trong code C#!
/// Dữ liệu do Quản trị viên quản lý realtime qua Redis / API Admin.
/// </summary>
public class RedisModerationKeywordStore : IModerationKeywordStore
{
    private readonly ILogger<RedisModerationKeywordStore> _logger;
    private readonly IRedisConnectionProvider? _redisProvider;
    private readonly IConnectionMultiplexer? _redis;
    private readonly SemaphoreSlim _lock = new(1, 1);

    private AhoCorasick? _cachedAutomaton;
    private DateTime _lastCacheTime = DateTime.MinValue;
    private static readonly TimeSpan CacheTtl = TimeSpan.FromMinutes(10);

    // Tiền tố Redis Key
    public const string ProfanitySetKey = "moderation:keywords:profanity";
    public const string SpamSetKey = "moderation:keywords:spam";

    public RedisModerationKeywordStore(
        ILogger<RedisModerationKeywordStore> logger,
        IRedisConnectionProvider? redisProvider = null,
        IConnectionMultiplexer? redis = null)
    {
        _logger = logger;
        _redisProvider = redisProvider;
        _redis = redis;
    }

    private IDatabase? TryGetDatabase()
    {
        try
        {
            if (_redisProvider != null)
            {
                return _redisProvider.GetDatabase();
            }
            if (_redis != null && _redis.IsConnected)
            {
                return _redis.GetDatabase();
            }
        }
        catch
        {
        }
        return null;
    }

    public async Task<IReadOnlyList<string>> GetKeywordsAsync(string category, CancellationToken ct = default)
    {
        var key = category.Equals("spam", StringComparison.OrdinalIgnoreCase) ? SpamSetKey : ProfanitySetKey;

        // 1. Đọc từ Redis Cache
        var db = TryGetDatabase();
        if (db != null)
        {
            try
            {
                var members = await db.SetMembersAsync(key);
                if (members.Length > 0)
                {
                    return members.Select(m => (string)m!).Where(s => !string.IsNullOrWhiteSpace(s)).ToList();
                }

                var seed = LoadSeedKeywordsFromFile(category);
                if (seed.Count > 0)
                {
                    await db.SetAddAsync(key, seed.Select(x => (RedisValue)x.Trim().ToLowerInvariant()).ToArray());
                    return seed;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Lỗi khi đọc từ khóa từ Redis key {Key}", key);
            }
        }

        // 2. Dự phòng an toàn: Đọc từ file JSON bên ngoài (nếu Redis chưa khởi tạo dữ liệu)
        return LoadSeedKeywordsFromFile(category);
    }

    public async Task<bool> AddKeywordAsync(string category, string keyword, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(keyword)) return false;
        var key = category.Equals("spam", StringComparison.OrdinalIgnoreCase) ? SpamSetKey : ProfanitySetKey;
        var normalized = keyword.Trim().ToLowerInvariant();

        var db = TryGetDatabase();
        if (db != null)
        {
            try
            {
                var added = await db.SetAddAsync(key, normalized);
                await InvalidateCacheAsync(ct);
                _logger.LogInformation("Đã thêm từ khóa '{Keyword}' vào Redis set '{Key}' (Realtime, không sửa code)", normalized, key);
                return added;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi thêm từ khóa vào Redis");
                return false;
            }
        }

        return false;
    }

    public async Task<bool> RemoveKeywordAsync(string category, string keyword, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(keyword)) return false;
        var key = category.Equals("spam", StringComparison.OrdinalIgnoreCase) ? SpamSetKey : ProfanitySetKey;
        var normalized = keyword.Trim().ToLowerInvariant();

        var db = TryGetDatabase();
        if (db != null)
        {
            try
            {
                var removed = await db.SetRemoveAsync(key, normalized);
                await InvalidateCacheAsync(ct);
                _logger.LogInformation("Đã xóa từ khóa '{Keyword}' khỏi Redis set '{Key}'", normalized, key);
                return removed;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi xóa từ khóa khỏi Redis");
                return false;
            }
        }

        return false;
    }

    public async Task<object> GetCompiledAutomatonAsync(CancellationToken ct = default)
    {
        return await GetAhoCorasickAsync(ct);
    }

    public async Task<AhoCorasick> GetAhoCorasickAsync(CancellationToken ct = default)
    {
        if (_cachedAutomaton != null && DateTime.UtcNow - _lastCacheTime < CacheTtl)
        {
            return _cachedAutomaton;
        }

        await _lock.WaitAsync(ct);
        try
        {
            if (_cachedAutomaton != null && DateTime.UtcNow - _lastCacheTime < CacheTtl)
            {
                return _cachedAutomaton;
            }

            var patterns = new List<(string Keyword, string Category)>();

            // Đọc danh mục từ thô tục (Profanity) từ Redis
            var profanityWords = await GetKeywordsAsync("profanity", ct);
            foreach (var w in profanityWords)
            {
                patterns.Add((w, "Profanity"));
            }

            // Đọc danh mục spam thương mại / lừa đảo (Spam) từ Redis
            var spamWords = await GetKeywordsAsync("spam", ct);
            foreach (var w in spamWords)
            {
                patterns.Add((w, "CommercialSpam"));
            }

            _cachedAutomaton = new AhoCorasick(patterns);
            _lastCacheTime = DateTime.UtcNow;
            _logger.LogInformation("Đã nạp {Count} từ khóa từ Redis vào Aho-Corasick Automaton trong RAM", patterns.Count);

            return _cachedAutomaton;
        }
        finally
        {
            _lock.Release();
        }
    }

    public Task InvalidateCacheAsync(CancellationToken ct = default)
    {
        _cachedAutomaton = null;
        _lastCacheTime = DateTime.MinValue;
        return Task.CompletedTask;
    }

    private static IReadOnlyList<string> LoadSeedKeywordsFromFile(string category)
    {
        try
        {
            var seedPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "moderation_seed_keywords.json");
            if (!File.Exists(seedPath))
            {
                seedPath = Path.Combine(Directory.GetCurrentDirectory(), "moderation_seed_keywords.json");
            }

            if (File.Exists(seedPath))
            {
                var json = File.ReadAllText(seedPath);
                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;
                var propName = category.Equals("spam", StringComparison.OrdinalIgnoreCase) ? "spam" : "profanity";
                if (root.TryGetProperty(propName, out var arrayProp) && arrayProp.ValueKind == JsonValueKind.Array)
                {
                    var list = new List<string>();
                    foreach (var item in arrayProp.EnumerateArray())
                    {
                        var str = item.GetString();
                        if (!string.IsNullOrWhiteSpace(str)) list.Add(str);
                    }
                    return list;
                }
            }
        }
        catch
        {
        }

        return Array.Empty<string>();
    }
}
