using Application.Common.Interfaces;
using Application.DTOs;
using Google.Apis.Auth;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

public class GoogleAuthService : IGoogleAuthService
{
    private readonly ILogger<GoogleAuthService> _logger;

    public GoogleAuthService(ILogger<GoogleAuthService> logger)
    {
        _logger = logger;
    }

    public async Task<GoogleUserInfo?> ValidateIdTokenAsync(string idToken, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(idToken))
            return null;

        try
        {
            var payload = await GoogleJsonWebSignature.ValidateAsync(idToken);
            if (payload == null)
                return null;

            return new GoogleUserInfo
            {
                GoogleId = payload.Subject,
                Email = payload.Email,
                FullName = payload.Name ?? payload.Email,
                PictureUrl = payload.Picture
            };
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to validate Google ID Token.");
            return null;
        }
    }
}
