using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Application.Common.Interfaces;
using Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace Infrastructure.Services;

public class JwtTokenService : IJwtTokenService
{
    private readonly string _secretKey;
    private readonly string _issuer;
    private readonly string _audience;
    private readonly int _expireMinutes;

    public JwtTokenService(IConfiguration configuration)
    {
        _secretKey = configuration["Jwt:SecretKey"] 
            ?? throw new InvalidOperationException("CRITICAL: JWT SecretKey is not configured!");
        _issuer = configuration["Jwt:Issuer"] 
            ?? throw new InvalidOperationException("CRITICAL: JWT Issuer is not configured!");
        _audience = configuration["Jwt:Audience"] 
            ?? throw new InvalidOperationException("CRITICAL: JWT Audience is not configured!");
        _expireMinutes = int.TryParse(configuration["Jwt:ExpireMinutes"], out var exp) ? exp : 1440;
    }

    public string GenerateAccessToken(User user, string? jti = null)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(JwtRegisteredClaimNames.Jti, jti ?? Guid.NewGuid().ToString("N")),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Role, user.Role.ToString())
        };

        if (user.Profile != null && !string.IsNullOrWhiteSpace(user.Profile.FullName))
        {
            claims.Add(new Claim(ClaimTypes.Name, user.Profile.FullName));
        }

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(_expireMinutes),
            Issuer = _issuer,
            Audience = _audience,
            SigningCredentials = credentials
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
        var randomNumber = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }

    public ClaimsPrincipal? GetPrincipalFromExpiredToken(string token)
    {
        var tokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = true,
            ValidAudience = _audience,
            ValidateIssuer = true,
            ValidIssuer = _issuer,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secretKey)),
            ValidateLifetime = false
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        try
        {
            var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out var securityToken);
            if (securityToken is not JwtSecurityToken jwtSecurityToken ||
                !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
            {
                return null;
            }

            return principal;
        }
        catch
        {
            return null;
        }
    }

    public string? GetJtiFromToken(string token)
    {
        var principal = GetPrincipalFromExpiredToken(token);
        return principal?.FindFirst(JwtRegisteredClaimNames.Jti)?.Value;
    }

    public long? GetUserIdFromToken(string token)
    {
        var principal = GetPrincipalFromExpiredToken(token);
        var sub = principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? principal?.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
            ?? principal?.FindFirst("sub")?.Value;

        return long.TryParse(sub, out var id) ? id : null;
    }
}
