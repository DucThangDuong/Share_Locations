namespace Application.Common.Interfaces;

public interface ITokenCacheService
{
    Task SetRefreshTokenAsync(long userId, string refreshToken, TimeSpan expiry, CancellationToken ct = default);
    Task<string?> GetRefreshTokenAsync(long userId, CancellationToken ct = default);
    Task RemoveRefreshTokenAsync(long userId, CancellationToken ct = default);
    Task BlacklistAccessTokenAsync(string jti, TimeSpan remainingTime, CancellationToken ct = default);
    Task<bool> IsAccessTokenBlacklistedAsync(string jti, CancellationToken ct = default);
    Task SetUserRevokedAfterMsAsync(long userId, long revokedAfterUnixMs, TimeSpan expiry, CancellationToken ct = default);
    Task<long?> GetUserRevokedAfterMsAsync(long userId, CancellationToken ct = default);
    Task SetUserStatusAsync(long userId, string status, TimeSpan expiry, CancellationToken ct = default);
    Task<string?> GetUserStatusAsync(long userId, CancellationToken ct = default);
}
