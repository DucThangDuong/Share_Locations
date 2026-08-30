using System.Security.Claims;
using Domain.Entities;

namespace Application.Common.Interfaces;

public interface IJwtTokenService
{
    string GenerateAccessToken(User user, string? jti = null);
    string GenerateRefreshToken();
    ClaimsPrincipal? GetPrincipalFromExpiredToken(string token);
    string? GetJtiFromToken(string token);
    long? GetUserIdFromToken(string token);
}
