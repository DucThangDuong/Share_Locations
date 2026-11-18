using Application.Common.Interfaces;

namespace Infrastructure.Services;

public class TokenCacheService : ITokenCacheService
{
    private readonly IEnterpriseCacheService _enterpriseCache;

    public TokenCacheService(IEnterpriseCacheService enterpriseCache)
    {
        _enterpriseCache = enterpriseCache;
    }

    public async Task SetRefreshTokenAsync(long userId, string refreshToken, TimeSpan expiry, CancellationToken ct = default)
    {
        var cacheKey = $"auth:refreshToken:{userId}";
        await _enterpriseCache.SetAsync(cacheKey, refreshToken, expiry, ct);
    }

    public async Task<string?> GetRefreshTokenAsync(long userId, CancellationToken ct = default)
    {
        var cacheKey = $"auth:refreshToken:{userId}";
        return await _enterpriseCache.GetAsync<string>(cacheKey, ct);
    }

    public async Task RemoveRefreshTokenAsync(long userId, CancellationToken ct = default)
    {
        var cacheKey = $"auth:refreshToken:{userId}";
        await _enterpriseCache.UnlinkKeyAsync(cacheKey, ct);
    }

    public async Task BlacklistAccessTokenAsync(string jti, TimeSpan remainingTime, CancellationToken ct = default)
    {
        var cacheKey = $"auth:blacklist:jti:{jti}";
        await _enterpriseCache.SetAsync(cacheKey, "blacklisted", remainingTime, ct);
    }

    public async Task<bool> IsAccessTokenBlacklistedAsync(string jti, CancellationToken ct = default)
    {
        var cacheKey = $"auth:blacklist:jti:{jti}";
        var value = await _enterpriseCache.GetAsync<string>(cacheKey, ct);
        return !string.IsNullOrEmpty(value);
    }

    public async Task SetUserRevokedAfterMsAsync(long userId, long revokedAfterUnixMs, TimeSpan expiry, CancellationToken ct = default)
    {
        var cacheKey = $"auth:revokedAfterMs:{userId}";
        await _enterpriseCache.SetAsync(cacheKey, revokedAfterUnixMs.ToString(), expiry, ct);
    }

    public async Task<long?> GetUserRevokedAfterMsAsync(long userId, CancellationToken ct = default)
    {
        var cacheKey = $"auth:revokedAfterMs:{userId}";
        var value = await _enterpriseCache.GetAsync<string>(cacheKey, ct);
        return long.TryParse(value, out var ms) ? ms : null;
    }

    public async Task SetUserStatusAsync(long userId, string status, TimeSpan expiry, CancellationToken ct = default)
    {
        var cacheKey = $"auth:userStatus:{userId}";
        await _enterpriseCache.SetAsync(cacheKey, status, expiry, ct);
    }

    public async Task<string?> GetUserStatusAsync(long userId, CancellationToken ct = default)
    {
        var cacheKey = $"auth:userStatus:{userId}";
        return await _enterpriseCache.GetAsync<string>(cacheKey, ct);
    }
}

