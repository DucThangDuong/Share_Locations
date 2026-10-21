using System.Net;
using System.Net.Security;
using System.Net.Sockets;
using System.Security.Authentication;
using System.Security.Cryptography.X509Certificates;
using Infrastructure.Caching.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using StackExchange.Redis;

namespace Infrastructure.Caching.Connection;

public sealed class ResilientRedisConnectionProvider : IRedisConnectionProvider
{
    private readonly RedisOptions _options;
    private readonly ILogger<ResilientRedisConnectionProvider> _logger;
    private readonly SemaphoreSlim _reconnectLock = new(initialCount: 1, maxCount: 1);

    private static readonly TimeSpan ReconnectMinInterval = TimeSpan.FromSeconds(60);
    private static readonly TimeSpan ReconnectErrorThreshold = TimeSpan.FromSeconds(30);
    private const int RetryMaxAttempts = 3;

    private long _lastReconnectTicks = DateTimeOffset.MinValue.UtcTicks;
    private DateTimeOffset _firstErrorTime = DateTimeOffset.MinValue;
    private DateTimeOffset _previousErrorTime = DateTimeOffset.MinValue;

    private Lazy<IConnectionMultiplexer> _lazyConnection;
    private bool _disposed;

    public ResilientRedisConnectionProvider(
        IOptions<RedisOptions> options,
        ILogger<ResilientRedisConnectionProvider> logger)
    {
        _options = options.Value ?? throw new ArgumentNullException(nameof(options));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _lazyConnection = CreateConnectionLazy();
    }

    public bool IsConnected
    {
        get
        {
            try
            {
                return _lazyConnection.IsValueCreated && _lazyConnection.Value.IsConnected;
            }
            catch
            {
                return false;
            }
        }
    }

    public IDatabase GetDatabase(int db = -1) => _lazyConnection.Value.GetDatabase(db);

    public IServer GetServer(EndPoint endpoint) => _lazyConnection.Value.GetServer(endpoint);

    public EndPoint[] GetEndPoints()
    {
        try
        {
            return _lazyConnection.Value.GetEndPoints();
        }
        catch
        {
            return Array.Empty<EndPoint>();
        }
    }

    public async Task<T> ExecuteWithResilienceAsync<T>(
        Func<IDatabase, Task<T>> operation,
        T fallbackValue,
        bool failOpen = true,
        CancellationToken ct = default)
    {
        for (int attempt = 1; attempt <= RetryMaxAttempts; attempt++)
        {
            ct.ThrowIfCancellationRequested();
            try
            {
                var db = GetDatabase();
                return await operation(db).ConfigureAwait(false);
            }
            catch (Exception ex) when (ex is RedisConnectionException or SocketException)
            {
                _logger.LogWarning(ex, "Lỗi kết nối mạng Redis (Lần thử {Attempt}/{Max}). Kiểm tra điều kiện ForceReconnect.", attempt, RetryMaxAttempts);
                await TryForceReconnectAsync(ex).ConfigureAwait(false);

                if (attempt == RetryMaxAttempts)
                    return HandleFinalFailure(ex, fallbackValue, failOpen);
            }
            catch (ObjectDisposedException ex)
            {
                _logger.LogInformation(ex, "Multiplexer cũ vừa được thay thế qua ForceReconnect, thử lại ngay trên kết nối mới.");
                if (attempt == RetryMaxAttempts)
                    return HandleFinalFailure(ex, fallbackValue, failOpen);
            }
            catch (RedisTimeoutException ex)
            {
                _logger.LogError(ex, "Redis phản hồi quá thời gian chờ ({TimeoutMs}ms).", _options.SyncAndAsyncTimeoutMs);
                return HandleFinalFailure(ex, fallbackValue, failOpen);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi bất ngờ khi thực thi lệnh Redis.");
                return HandleFinalFailure(ex, fallbackValue, failOpen);
            }
        }

        return fallbackValue;
    }

    private Lazy<IConnectionMultiplexer> CreateConnectionLazy()
    {
        return new Lazy<IConnectionMultiplexer>(() =>
        {
            var config = BuildSecureConfigurationOptions();
            var multiplexer = ConnectionMultiplexer.Connect(config);

            multiplexer.ConnectionFailed += (_, e) =>
                _logger.LogError(e.Exception, "Kết nối Redis bị gián đoạn. Loại lỗi: {FailureType}, Endpoint: {Endpoint}", e.FailureType, e.EndPoint);

            multiplexer.ConnectionRestored += (_, e) =>
                _logger.LogInformation("Đã khôi phục kết nối Redis thành công tới Endpoint: {Endpoint}", e.EndPoint);

            multiplexer.InternalError += (_, e) =>
                _logger.LogError(e.Exception, "Lỗi nội bộ thư viện Redis tại {Origin}", e.Origin);

            return multiplexer;
        }, LazyThreadSafetyMode.ExecutionAndPublication);
    }

    private ConfigurationOptions BuildSecureConfigurationOptions()
    {
        var config = ConfigurationOptions.Parse(_options.Endpoints);

        config.AbortOnConnectFail = false;

        config.ConnectTimeout = _options.ConnectTimeoutMs;
        config.SyncTimeout = _options.SyncAndAsyncTimeoutMs;
        config.AsyncTimeout = _options.SyncAndAsyncTimeoutMs;
        config.ConnectRetry = 3;
        config.KeepAlive = 30;
        config.ReconnectRetryPolicy = new ExponentialRetry(deltaBackOffMilliseconds: 1000, maxDeltaBackOffMilliseconds: 10000);

        if (!string.IsNullOrWhiteSpace(_options.AclUser))
        {
            config.User = _options.AclUser;
        }
        if (!string.IsNullOrWhiteSpace(_options.AclPassword))
        {
            config.Password = _options.AclPassword;
        }

        config.Ssl = _options.UseTls;
        if (_options.UseTls)
        {
            config.SslProtocols = SslProtocols.Tls12 | SslProtocols.Tls13;
            config.CertificateValidation += ValidateServerCertificate;
        }

        return config;
    }

    private bool ValidateServerCertificate(
        object sender,
        X509Certificate? certificate,
        X509Chain? chain,
        SslPolicyErrors sslPolicyErrors)
    {
        if (sslPolicyErrors == SslPolicyErrors.None)
            return true;

        if (!string.IsNullOrWhiteSpace(_options.TrustedIssuerCaCertPath) &&
            certificate is not null &&
            chain is not null &&
            File.Exists(_options.TrustedIssuerCaCertPath))
        {
            using var customCa = new X509Certificate2(_options.TrustedIssuerCaCertPath);
            chain.ChainPolicy.TrustMode = X509ChainTrustMode.CustomRootTrust;
            chain.ChainPolicy.CustomTrustStore.Add(customCa);
            return chain.Build(new X509Certificate2(certificate));
        }

        _logger.LogCritical("Từ chối kết nối TLS tới Redis do chứng chỉ không hợp lệ: {SslPolicyErrors}", sslPolicyErrors);
        return false;
    }

    private async Task TryForceReconnectAsync(Exception ex)
    {
        var utcNow = DateTimeOffset.UtcNow;
        var previousTicks = Interlocked.Read(ref _lastReconnectTicks);
        var previousReconnectTime = new DateTimeOffset(previousTicks, TimeSpan.Zero);

        // Chưa hết thời gian hồi chiêu (60s) giữa 2 lần ForceReconnect thì bỏ qua
        if (utcNow - previousReconnectTime < ReconnectMinInterval)
            return;

        if (!await _reconnectLock.WaitAsync(TimeSpan.FromMilliseconds(50)).ConfigureAwait(false))
            return;

        try
        {
            utcNow = DateTimeOffset.UtcNow;
            if (utcNow - _previousErrorTime > ReconnectErrorThreshold)
            {
                _firstErrorTime = utcNow;
            }
            _previousErrorTime = utcNow;

            // Chỉ tạo lại kết nối nếu lỗi mạng kéo dài liên tục vượt ngưỡng (30s) và đã qua thời gian hồi chiêu (60s)
            if (utcNow - _firstErrorTime >= ReconnectErrorThreshold &&
                utcNow - previousReconnectTime >= ReconnectMinInterval)
            {
                _logger.LogWarning(ex, "Tiến hành ForceReconnect: Khởi tạo lại ConnectionMultiplexer mới.");
                var oldConnection = _lazyConnection;
                _lazyConnection = CreateConnectionLazy();
                Interlocked.Exchange(ref _lastReconnectTicks, utcNow.UtcTicks);
                _firstErrorTime = DateTimeOffset.MinValue;

                if (oldConnection.IsValueCreated)
                {
                    // Đóng kết nối cũ ở luồng nền sau 5 giây để các lệnh đang chạy dở kịp hoàn tất
                    _ = Task.Run(async () =>
                    {
                        await Task.Delay(TimeSpan.FromSeconds(5)).ConfigureAwait(false);
                        try
                        {
                            await oldConnection.Value.CloseAsync().ConfigureAwait(false);
                            oldConnection.Value.Dispose();
                        }
                        catch
                        {
                            // Bỏ qua lỗi khi đóng socket cũ
                        }
                    });
                }
            }
        }
        finally
        {
            _reconnectLock.Release();
        }
    }

    private T HandleFinalFailure<T>(Exception ex, T fallbackValue, bool failOpen)
    {
        if (failOpen)
        {
            _logger.LogWarning(ex, "Chế độ Fail-Open kích hoạt: Trả về giá trị dự phòng để không làm gián đoạn dịch vụ người dùng.");
            return fallbackValue;
        }

        _logger.LogError(ex, "Chế độ Fail-Closed kích hoạt: Từ chối yêu cầu để bảo toàn tính toàn vẹn dữ liệu / chống gian lận.");
        throw ex;
    }

    public async ValueTask DisposeAsync()
    {
        if (_disposed) return;
        _disposed = true;
        _reconnectLock.Dispose();
        if (_lazyConnection.IsValueCreated)
        {
            await _lazyConnection.Value.CloseAsync().ConfigureAwait(false);
            _lazyConnection.Value.Dispose();
        }
    }
}
