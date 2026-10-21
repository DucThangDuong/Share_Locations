namespace Application.Common.Interfaces;

public interface IEnterpriseCacheService
{
    Task<T?> GetOrCreateAsync<T>(string rawKey, Func<CancellationToken, Task<T?>> factory, TimeSpan baseTtl, CancellationToken ct = default);
    Task<T?> GetAsync<T>(string rawKey, CancellationToken ct = default);
    Task<bool> SetAsync<T>(string rawKey, T value, TimeSpan ttl, CancellationToken ct = default);
    Task<bool> UnlinkKeyAsync(string rawKey, CancellationToken ct = default);
    Task<long> RemoveByPatternAsync(string pattern, CancellationToken ct = default);
    Task<IAsyncDisposable?> TryAcquireDistributedLockAsync(string resourceName, TimeSpan expiry, CancellationToken ct = default);
    Task<bool> IsAllowedByRateLimitAsync(string subjectId, int maxPermits, TimeSpan window, CancellationToken ct = default);
}

