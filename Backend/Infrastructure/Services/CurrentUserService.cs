using System.Security.Claims;
using Application.Common.Interfaces;
using Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;

namespace Infrastructure.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    private ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;

    public long? UserId
    {
        get
        {
            var val = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                   ?? User?.FindFirst("sub")?.Value;
            return long.TryParse(val, out var id) ? id : null;
        }
    }

    public string? Email => User?.FindFirst(ClaimTypes.Email)?.Value ?? User?.FindFirst("email")?.Value;

    public bool IsAuthenticated => User?.Identity?.IsAuthenticated == true;

    public IReadOnlyList<string> Roles => User == null
        ? Array.Empty<string>()
        : User.FindAll(ClaimTypes.Role)
              .Concat(User.FindAll("role"))
              .Select(c => c.Value)
              .Distinct(StringComparer.OrdinalIgnoreCase)
              .ToList();

    public bool IsSystemAdmin =>
        Roles.Any(r => r.Equals("SYSTEM_ADMIN", StringComparison.OrdinalIgnoreCase) ||
                       r.Equals("SystemAdmin", StringComparison.OrdinalIgnoreCase)) ||
        (User?.HasClaim("is_superadmin", "true") == true);

    public bool IsCategoryAdmin =>
        Roles.Any(r => r.Equals("CATEGORY_ADMIN", StringComparison.OrdinalIgnoreCase) ||
                       r.Equals("CategoryAdmin", StringComparison.OrdinalIgnoreCase));

    public IReadOnlyList<string> Permissions => User == null
        ? Array.Empty<string>()
        : User.FindAll("permission")
              .Select(c => c.Value)
              .Distinct(StringComparer.OrdinalIgnoreCase)
              .ToList();

    public IReadOnlyList<int> CategoryScopes
    {
        get
        {
            if (User == null) return Array.Empty<int>();

            var scopes = User.FindAll("category_scope")
                             .Select(c => int.TryParse(c.Value, out var v) ? v : 0)
                             .Where(v => v > 0)
                             .Distinct()
                             .ToList();

            if (scopes.Count > 0) return scopes;

            // Fallback DB nếu token cũ chưa chứa scopes
            if (IsCategoryAdmin && UserId.HasValue)
            {
                var dbContext = _httpContextAccessor.HttpContext?.RequestServices.GetService<TravelReviewDbContext>();
                if (dbContext != null)
                {
                    scopes = dbContext.AdminCategoryScopes
                        .Where(s => s.UserId == UserId.Value)
                        .Select(s => s.CategoryId)
                        .ToList();
                }
            }

            return scopes;
        }
    }

    public IReadOnlyList<int> ProvinceScopes
    {
        get
        {
            if (User == null) return Array.Empty<int>();

            var scopes = User.FindAll("province_scope")
                             .Select(c => int.TryParse(c.Value, out var v) ? v : 0)
                             .Where(v => v > 0)
                             .Distinct()
                             .ToList();

            if (scopes.Count > 0) return scopes;

            // Fallback DB nếu token cũ chưa chứa scopes
            if (IsCategoryAdmin && UserId.HasValue)
            {
                var dbContext = _httpContextAccessor.HttpContext?.RequestServices.GetService<TravelReviewDbContext>();
                if (dbContext != null)
                {
                    scopes = dbContext.AdminProvinceScopes
                        .Where(s => s.UserId == UserId.Value)
                        .Select(s => s.ProvinceId)
                        .ToList();
                }
            }

            return scopes;
        }
    }

    public IReadOnlyList<int> RegionScopes
    {
        get
        {
            if (User == null) return Array.Empty<int>();

            var scopes = User.FindAll("region_scope")
                             .Select(c => int.TryParse(c.Value, out var v) ? v : 0)
                             .Where(v => v > 0)
                             .Distinct()
                             .ToList();

            if (scopes.Count > 0) return scopes;

            // Fallback DB nếu token cũ chưa chứa scopes
            if (IsCategoryAdmin && UserId.HasValue)
            {
                var dbContext = _httpContextAccessor.HttpContext?.RequestServices.GetService<TravelReviewDbContext>();
                if (dbContext != null)
                {
                    scopes = dbContext.AdminRegionScopes
                        .Where(s => s.UserId == UserId.Value)
                        .Select(s => s.RegionId)
                        .ToList();
                }
            }

            return scopes;
        }
    }

    public bool HasPermission(string permission)
    {
        if (IsSystemAdmin) return true;
        return Permissions.Contains(permission, StringComparer.OrdinalIgnoreCase);
    }
}
