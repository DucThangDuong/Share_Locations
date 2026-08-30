using System.Text.Json;
using Application.Common.Interfaces;
using Microsoft.Extensions.Caching.Distributed;

namespace Infrastructure.Services;

public class TokenCacheService : ITokenCacheService
{
    private readonly IDistributedCache _cache;

    public TokenCacheService(IDistributedCache cache)
    {
        _cache = cache;
    }

    public async Task SetRefreshTokenAsync(long userId, string refreshToken, TimeSpan expiry, CancellationToken ct = default)
    {
        var cacheKey = $"auth:refreshToken:{userId}";
        var options = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = expiry
        };

        await _cache.SetStringAsync(cacheKey, refreshToken, options, ct);
    }

    public async Task<string?> GetRefreshTokenAsync(long userId, CancellationToken ct = default)
    {
        var cacheKey = $"auth:refreshToken:{userId}";
        return await _cache.GetStringAsync(cacheKey, ct);
    }

    public async Task RemoveRefreshTokenAsync(long userId, CancellationToken ct = default)
    {
        var cacheKey = $"auth:refreshToken:{userId}";
        await _cache.RemoveAsync(cacheKey, ct);
    }

    public async Task BlacklistAccessTokenAsync(string jti, TimeSpan remainingTime, CancellationToken ct = default)
    {
        var cacheKey = $"auth:blacklist:jti:{jti}";
        var options = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = remainingTime
        };

        await _cache.SetStringAsync(cacheKey, "blacklisted", options, ct);
    }

    public async Task<bool> IsAccessTokenBlacklistedAsync(string jti, CancellationToken ct = default)
    {
        var cacheKey = $"auth:blacklist:jti:{jti}";
        var value = await _cache.GetStringAsync(cacheKey, ct);
        return !string.IsNullOrEmpty(value);
    }
}
