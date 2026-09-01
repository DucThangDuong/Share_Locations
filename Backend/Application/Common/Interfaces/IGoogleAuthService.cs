using Application.DTOs;

namespace Application.Common.Interfaces;

public interface IGoogleAuthService
{
    Task<GoogleUserInfo?> ValidateIdTokenAsync(string idToken, CancellationToken ct = default);
}
