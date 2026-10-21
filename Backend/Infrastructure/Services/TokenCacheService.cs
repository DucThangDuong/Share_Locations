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
}

