using Application.Common.Interfaces;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

public class CacheService : ICacheService
{
    private readonly IEnterpriseCacheService _enterpriseCache;
    private readonly ILogger<CacheService> _logger;

    public CacheService(
        IEnterpriseCacheService enterpriseCache,
        ILogger<CacheService> logger)
    {
        _enterpriseCache = enterpriseCache;
        _logger = logger;
    }

    public Task<T?> GetAsync<T>(string key, CancellationToken ct = default)
    {
        return _enterpriseCache.GetAsync<T>(key, ct);
    }

    public Task<T?> GetOrCreateAsync<T>(
        string key,
        Func<CancellationToken, Task<T?>> factory,
        TimeSpan? expiration = null,
        CancellationToken ct = default)
    {
        return _enterpriseCache.GetOrCreateAsync<T>(
            rawKey: key,
            factory: factory,
            baseTtl: expiration ?? TimeSpan.FromMinutes(30),
            ct: ct);
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiration = null, CancellationToken ct = default)
    {
        await _enterpriseCache.SetAsync(
            rawKey: key,
            value: value,
            ttl: expiration ?? TimeSpan.FromMinutes(30),
            ct: ct).ConfigureAwait(false);
    }

    public async Task RemoveAsync(string key, CancellationToken ct = default)
    {
        await _enterpriseCache.UnlinkKeyAsync(key, ct).ConfigureAwait(false);
    }

    public async Task RemoveByPatternAsync(string pattern, CancellationToken ct = default)
    {
        long deleted = await _enterpriseCache.RemoveByPatternAsync(pattern, ct).ConfigureAwait(false);
    }
}

