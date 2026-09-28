namespace Application.Common.Interfaces;

public interface ICurrentUserService
{
    long? UserId { get; }
    string? Email { get; }
    bool IsAuthenticated { get; }
    bool IsSystemAdmin { get; }
    bool IsCategoryAdmin { get; }
    IReadOnlyList<string> Roles { get; }
    IReadOnlyList<string> Permissions { get; }
    IReadOnlyList<int> CategoryScopes { get; }
    IReadOnlyList<int> ProvinceScopes { get; }
    IReadOnlyList<int> RegionScopes { get; }
    bool HasPermission(string permission);
}
