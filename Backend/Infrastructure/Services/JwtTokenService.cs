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
        _expireMinutes = int.TryParse(configuration["Jwt:ExpireMinutes"], out var exp) ? exp : 15;
    }

    private static readonly HashSet<string> AllSystemPermissions = new(StringComparer.OrdinalIgnoreCase)
    {
        "PLACE_READ",
        "PLACE_MODERATE",
        "CONTENT_MODERATE",
        "REPORT_RESOLVE",
        "PROPOSAL_REVIEW",
        "TASK_MANAGE",
        "USER_MANAGE",
        "AUDIT_READ",
        "SYSTEM_CONFIG"
    };

    private static (string PascalRole, string DbRole) NormalizeRoleNames(string rawRole)
    {
        var cleaned = rawRole.Replace("_", "").Trim();
        if (cleaned.Equals(Domain.Constants.AppRoles.SystemAdmin, StringComparison.OrdinalIgnoreCase))
            return (Domain.Constants.AppRoles.SystemAdmin, Domain.Constants.AppRoles.DbSystemAdmin);
        if (cleaned.Equals(Domain.Constants.AppRoles.CategoryAdmin, StringComparison.OrdinalIgnoreCase))
            return (Domain.Constants.AppRoles.CategoryAdmin, Domain.Constants.AppRoles.DbCategoryAdmin);
        return (Domain.Constants.AppRoles.User, Domain.Constants.AppRoles.DbUser);
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
            new(ClaimTypes.Email, user.Email)
        };

        // 1. Phân giải vai trò (Roles) từ bảng liên kết UserRoles
        var activeRoleCodes = user.UserRoles
            .Where(ur => ur.Role != null && ur.Role.IsActive && (!ur.ExpiresAt.HasValue || ur.ExpiresAt.Value > DateTime.UtcNow))
            .Select(ur => ur.Role.Code)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (activeRoleCodes.Count == 0)
        {
            activeRoleCodes.Add(user.Role.ToString());
        }

        bool isSystemAdmin = activeRoleCodes.Any(r =>
            r.Equals("SYSTEM_ADMIN", StringComparison.OrdinalIgnoreCase) ||
            r.Equals("SystemAdmin", StringComparison.OrdinalIgnoreCase));

        // Thêm Claims Role (cả dạng PascalCase và DB uppercase để tương thích mọi cấu hình)
        var distinctRoleCodes = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var r in activeRoleCodes)
        {
            var (pascal, dbCode) = NormalizeRoleNames(r);
            distinctRoleCodes.Add(pascal);
            distinctRoleCodes.Add(dbCode);
        }

        foreach (var r in distinctRoleCodes)
        {
            claims.Add(new Claim(ClaimTypes.Role, r));
            claims.Add(new Claim("role", r));
        }

        // 2. Quyền hạn (Permissions) - Admin hệ thống là quyền tối cao có thể làm bất cứ điều gì
        var distinctPermissions = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        if (isSystemAdmin)
        {
            claims.Add(new Claim("is_superadmin", "true"));
            claims.Add(new Claim("is_all_scopes", "true"));

            foreach (var perm in AllSystemPermissions)
            {
                distinctPermissions.Add(perm);
            }
        }
        else
        {
            foreach (var ur in user.UserRoles.Where(ur => ur.Role != null && ur.Role.IsActive && (!ur.ExpiresAt.HasValue || ur.ExpiresAt.Value > DateTime.UtcNow)))
            {
                foreach (var rp in ur.Role.RolePermissions.Where(rp => rp.Permission != null))
                {
                    if (!string.IsNullOrWhiteSpace(rp.Permission.Code))
                    {
                        distinctPermissions.Add(rp.Permission.Code.Trim().ToUpperInvariant());
                    }
                }
            }
        }

        foreach (var perm in distinctPermissions)
        {
            claims.Add(new Claim("permission", perm));
        }

        // 3. Phạm vi quản lý (Scopes) cho CategoryAdmin
        if (!isSystemAdmin)
        {
            foreach (var scope in user.AdminCategoryScopes)
            {
                claims.Add(new Claim("category_scope", scope.CategoryId.ToString()));
            }

            foreach (var scope in user.AdminProvinceScopes)
            {
                claims.Add(new Claim("province_scope", scope.ProvinceId.ToString()));
            }

            foreach (var scope in user.AdminRegionScopes)
            {
                claims.Add(new Claim("region_scope", scope.RegionId.ToString()));
            }
        }

        // 4. Thông tin hồ sơ (Profile)
        if (user.Profile != null)
        {
            if (!string.IsNullOrWhiteSpace(user.Profile.FullName))
                claims.Add(new Claim(ClaimTypes.Name, user.Profile.FullName));

            if (!string.IsNullOrWhiteSpace(user.Profile.AvatarUrl))
                claims.Add(new Claim("avatar_url", user.Profile.AvatarUrl));

            if (!string.IsNullOrWhiteSpace(user.Profile.RankLevel))
                claims.Add(new Claim("rank_level", user.Profile.RankLevel));

            claims.Add(new Claim("reputation_score", user.Profile.ReputationScore.ToString()));
        }

        claims.Add(new Claim("user_status", ((byte)user.Status).ToString()));

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
