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

    public string? DeviceId
    {
        get
        {
            var raw = _httpContextAccessor.HttpContext?.Request.Headers["X-Device-Id"].FirstOrDefault();
            return !string.IsNullOrWhiteSpace(raw) && Guid.TryParse(raw.Trim(), out var guid)
                ? guid.ToString("D")
                : null;
        }
    }

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

            var httpContext = _httpContextAccessor.HttpContext;
            if (httpContext?.Items.TryGetValue("__AdminCategoryScopes", out var cached) == true && cached is IReadOnlyList<int> cachedList)
            {
                return cachedList;
            }

            if (!IsSystemAdmin && UserId.HasValue)
            {
                var dbContext = httpContext?.RequestServices.GetService<TravelReviewDbContext>();
                if (dbContext != null)
                {
                    var dbScopes = dbContext.AdminCategoryScopes
                        .Where(s => s.UserId == UserId.Value)
                        .Select(s => s.CategoryId)
                        .Distinct()
                        .ToList();
                    if (httpContext != null) httpContext.Items["__AdminCategoryScopes"] = dbScopes;
                    return dbScopes;
                }
            }

            var scopes = User.FindAll("category_scope")
                             .Select(c => int.TryParse(c.Value, out var v) ? v : 0)
                             .Where(v => v > 0)
                             .Distinct()
                             .ToList();

            if (httpContext != null) httpContext.Items["__AdminCategoryScopes"] = scopes;
            return scopes;
        }
    }

    public IReadOnlyList<int> ProvinceScopes
    {
        get
        {
            if (User == null) return Array.Empty<int>();

            var httpContext = _httpContextAccessor.HttpContext;
            if (httpContext?.Items.TryGetValue("__AdminProvinceScopes", out var cached) == true && cached is IReadOnlyList<int> cachedList)
            {
                return cachedList;
            }

            if (!IsSystemAdmin && UserId.HasValue)
            {
                var dbContext = httpContext?.RequestServices.GetService<TravelReviewDbContext>();
                if (dbContext != null)
                {
                    var dbScopes = dbContext.AdminProvinceScopes
                        .Where(s => s.UserId == UserId.Value)
                        .Select(s => s.ProvinceId)
                        .Distinct()
                        .ToList();
                    if (httpContext != null) httpContext.Items["__AdminProvinceScopes"] = dbScopes;
                    return dbScopes;
                }
            }

            var scopes = User.FindAll("province_scope")
                             .Select(c => int.TryParse(c.Value, out var v) ? v : 0)
                             .Where(v => v > 0)
                             .Distinct()
                             .ToList();

            if (httpContext != null) httpContext.Items["__AdminProvinceScopes"] = scopes;
            return scopes;
        }
    }

    public IReadOnlyList<int> RegionScopes
    {
        get
        {
            if (User == null) return Array.Empty<int>();
            if (ProvinceScopes.Count > 0) return Array.Empty<int>();

            var httpContext = _httpContextAccessor.HttpContext;
            if (httpContext?.Items.TryGetValue("__AdminRegionScopes", out var cached) == true && cached is IReadOnlyList<int> cachedList)
            {
                return cachedList;
            }

            if (!IsSystemAdmin && UserId.HasValue)
            {
                var dbContext = httpContext?.RequestServices.GetService<TravelReviewDbContext>();
                if (dbContext != null)
                {
                    var dbScopes = dbContext.AdminRegionScopes
                        .Where(s => s.UserId == UserId.Value)
                        .Select(s => s.RegionId)
                        .Distinct()
                        .ToList();
                    if (httpContext != null) httpContext.Items["__AdminRegionScopes"] = dbScopes;
                    return dbScopes;
                }
            }

            var scopes = User.FindAll("region_scope")
                             .Select(c => int.TryParse(c.Value, out var v) ? v : 0)
                             .Where(v => v > 0)
                             .Distinct()
                             .ToList();

            if (httpContext != null) httpContext.Items["__AdminRegionScopes"] = scopes;
            return scopes;
        }
    }

    public bool HasPermission(string permission)
    {
        if (IsSystemAdmin) return true;
        return Permissions.Contains(permission, StringComparer.OrdinalIgnoreCase);
    }
}
