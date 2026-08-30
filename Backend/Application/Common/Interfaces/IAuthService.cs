using Application.DTOs;

namespace Application.Common.Interfaces;

public interface IAuthService
{
    Task<Result<AuthTokenResponse>> LoginAsync(string email, string password, CancellationToken ct = default);
    Task<Result<long>> RegisterAsync(string fullName, string email, string password, CancellationToken ct = default);
    Task<Result<AuthTokenResponse>> RefreshTokenAsync(string? accessToken, string? refreshToken, CancellationToken ct = default);
    Task<Result<bool>> LogoutAsync(string? accessToken, string? refreshToken, CancellationToken ct = default);
    Task<Result<AuthTokenResponse>> GoogleLoginAsync(string idToken, CancellationToken ct = default);
}
