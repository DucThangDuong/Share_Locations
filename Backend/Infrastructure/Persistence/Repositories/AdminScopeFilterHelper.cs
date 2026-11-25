using System.Data;
using Application.Common.Interfaces;
using Dapper;

namespace Infrastructure.Persistence.Repositories;

public static class AdminScopeFilterHelper
{
    public static void ApplyPlaceScope(
        ICurrentUserService currentUser,
        List<string> whereClauses,
        DynamicParameters parameters,
        string placeAlias = "p",
        string provinceAlias = "prov")
    {
        if (currentUser.IsSystemAdmin) return;

        var catScopes = currentUser.CategoryScopes;
        var provScopes = currentUser.ProvinceScopes;

        if (catScopes.Count == 0 || provScopes.Count == 0)
        {
            whereClauses.Add("1 = 0");
            return;
        }

        whereClauses.Add($"{placeAlias}.CategoryId IN @ScopeCategoryIds");
        parameters.Add("ScopeCategoryIds", catScopes);

        whereClauses.Add($"{placeAlias}.ProvinceId IN @ScopeProvinceIds");
        parameters.Add("ScopeProvinceIds", provScopes);
    }

    public static void ApplyBlogScope(
        ICurrentUserService currentUser,
        List<string> whereClauses,
        DynamicParameters parameters,
        string blogAlias = "b")
    {
        if (currentUser.IsSystemAdmin) return;

        var catScopes = currentUser.CategoryScopes;
        if (catScopes.Count > 0)
        {
            whereClauses.Add($"{blogAlias}.CategoryId IN @ScopeCategoryIds");
            parameters.Add("ScopeCategoryIds", catScopes);
        }
        else
        {
            whereClauses.Add("1 = 0");
        }
    }

    public static void ApplyFoodScope(
        ICurrentUserService currentUser,
        List<string> whereClauses,
        DynamicParameters parameters,
        string foodAlias = "f")
    {
        if (currentUser.IsSystemAdmin) return;

        var provScopes = currentUser.ProvinceScopes;
        if (provScopes.Count == 0)
        {
            whereClauses.Add("1 = 0");
            return;
        }

        whereClauses.Add($"EXISTS (SELECT 1 FROM dbo.FoodProvinces fp_pr WHERE fp_pr.FoodId = {foodAlias}.Id AND fp_pr.ProvinceId IN @ScopeProvinceIds)");
        parameters.Add("ScopeProvinceIds", provScopes);
    }

    public static async Task<bool> IsPlaceInScopeAsync(
        ICurrentUserService currentUser,
        IDbConnection connection,
        long placeId)
    {
        if (currentUser.IsSystemAdmin) return true;

        var place = await GetPlaceScopeKeysAsync(connection, placeId);
        if (place == null) return false;

        return ValidatePlaceInputScope(currentUser, place.Value.CategoryId, place.Value.ProvinceId);
    }

    public static async Task<bool> EnsurePlaceInScopeAsync(
        ICurrentUserService currentUser,
        IDbConnection connection,
        long placeId,
        string? errorMessage = null)
    {
        if (currentUser.IsSystemAdmin) return true;

        var place = await GetPlaceScopeKeysAsync(connection, placeId);
        if (place == null) return false;

        EnsurePlaceInputScope(
            currentUser,
            place.Value.CategoryId,
            place.Value.ProvinceId,
            errorMessage ?? "Bạn không có quyền thao tác với địa điểm ngoài phạm vi danh mục hoặc tỉnh/thành phố quản lý.");

        return true;
    }

    public static async Task<bool> IsBlogInScopeAsync(
        ICurrentUserService currentUser,
        IDbConnection connection,
        long blogId)
    {
        if (currentUser.IsSystemAdmin) return true;

        var categoryId = await connection.QueryFirstOrDefaultAsync<int?>("SELECT CategoryId FROM dbo.Blogs WHERE Id = @Id;", new { Id = blogId });
        if (!categoryId.HasValue) return false;

        return ValidateBlogInputScope(currentUser, categoryId);
    }

    public static async Task<bool> EnsureBlogInScopeAsync(
        ICurrentUserService currentUser,
        IDbConnection connection,
        long blogId,
        string? errorMessage = null)
    {
        if (currentUser.IsSystemAdmin) return true;

        var categoryId = await connection.QueryFirstOrDefaultAsync<int?>("SELECT CategoryId FROM dbo.Blogs WHERE Id = @Id;", new { Id = blogId });
        if (!categoryId.HasValue) return false;

        EnsureBlogInputScope(
            currentUser,
            categoryId,
            errorMessage ?? "Bạn không có quyền thao tác với bài viết ngoài phạm vi danh mục quản lý.");

        return true;
    }

    private static async Task<(int CategoryId, int ProvinceId)?> GetPlaceScopeKeysAsync(IDbConnection connection, long placeId)
    {
        const string sql = @"
            SELECT p.CategoryId, p.ProvinceId
            FROM dbo.Places p
            WHERE p.Id = @Id AND p.IsDeleted = 0;";

        return await connection.QueryFirstOrDefaultAsync<(int CategoryId, int ProvinceId)?>(sql, new { Id = placeId });
    }
    public static void ApplyTripScope(
        ICurrentUserService currentUser,
        List<string> whereClauses,
        DynamicParameters parameters,
        string tripAlias = "t")
    {
        if (currentUser.IsSystemAdmin) return;

        var provScopes = currentUser.ProvinceScopes;
        if (provScopes.Count == 0)
        {
            whereClauses.Add("1 = 0");
            return;
        }

        whereClauses.Add($@"(
            SELECT TOP 1 pl_sc.ProvinceId
            FROM dbo.TripDays td_sc
            INNER JOIN dbo.TripPlaces tp_sc ON td_sc.Id = tp_sc.TripDayId
            INNER JOIN dbo.Places pl_sc ON tp_sc.PlaceId = pl_sc.Id
            WHERE td_sc.TripId = {tripAlias}.Id AND pl_sc.IsDeleted = 0
            GROUP BY pl_sc.ProvinceId
            ORDER BY COUNT(1) DESC, pl_sc.ProvinceId ASC
        ) IN @ScopeProvinceIds");
        parameters.Add("ScopeProvinceIds", provScopes);
    }

    public static async Task<bool> EnsureTripInScopeAsync(
        ICurrentUserService currentUser,
        IDbConnection connection,
        long tripId,
        string? errorMessage = null)
    {
        if (currentUser.IsSystemAdmin) return true;

        var exists = await connection.QueryFirstOrDefaultAsync<int?>(
            "SELECT 1 FROM dbo.Trips WHERE Id = @Id AND Privacy IN (0, 2);",
            new { Id = tripId });
        if (!exists.HasValue) return false;

        var provScopes = currentUser.ProvinceScopes;
        const string primaryProvSql = @"
            SELECT TOP 1 pl.ProvinceId
            FROM dbo.TripDays td
            INNER JOIN dbo.TripPlaces tp ON td.Id = tp.TripDayId
            INNER JOIN dbo.Places pl ON tp.PlaceId = pl.Id
            WHERE td.TripId = @Id AND pl.IsDeleted = 0
            GROUP BY pl.ProvinceId
            ORDER BY COUNT(1) DESC, pl.ProvinceId ASC;";

        var primaryProvinceId = await connection.QueryFirstOrDefaultAsync<int?>(
            primaryProvSql,
            new { Id = tripId });

        if (provScopes.Count == 0 || !primaryProvinceId.HasValue || !provScopes.Contains(primaryProvinceId.Value))
        {
            throw new UnauthorizedAccessException(
                errorMessage ?? "Bạn không có quyền thao tác với chuyến đi ngoài phạm vi tỉnh/thành phố quản lý.");
        }

        return true;
    }

    public static void ApplyCollectionScope(
        ICurrentUserService currentUser,
        List<string> whereClauses,
        DynamicParameters parameters,
        string collectionAlias = "c")
    {
        if (currentUser.IsSystemAdmin) return;

        var provScopes = currentUser.ProvinceScopes;
        if (provScopes.Count > 0)
        {
            whereClauses.Add($"{collectionAlias}.ProvinceId IN @ScopeProvinceIds");
            parameters.Add("ScopeProvinceIds", provScopes);
        }
        else
        {
            whereClauses.Add("1 = 0");
        }
    }

    public static async Task<bool> IsCollectionInScopeAsync(
        ICurrentUserService currentUser,
        IDbConnection connection,
        int collectionId)
    {
        if (currentUser.IsSystemAdmin) return true;

        var provScopes = currentUser.ProvinceScopes;
        if (provScopes.Count == 0) return false;

        const string sql = "SELECT ProvinceId FROM dbo.Collections WHERE Id = @Id;";
        var provinceId = await connection.QueryFirstOrDefaultAsync<int?>(sql, new { Id = collectionId });
        if (!provinceId.HasValue) return false;

        return provScopes.Contains(provinceId.Value);
    }

    public static bool ValidatePlaceInputScope(
        ICurrentUserService currentUser,
        int categoryId,
        int provinceId)
    {
        if (currentUser.IsSystemAdmin) return true;

        var catScopes = currentUser.CategoryScopes;
        var provScopes = currentUser.ProvinceScopes;

        if (catScopes.Count == 0 || provScopes.Count == 0) return false;

        return catScopes.Contains(categoryId) && provScopes.Contains(provinceId);
    }

    public static bool ValidateFoodInputScope(
        ICurrentUserService currentUser,
        int? provinceId)
    {
        if (currentUser.IsSystemAdmin) return true;

        var provScopes = currentUser.ProvinceScopes;
        if (provScopes.Count == 0 || !provinceId.HasValue) return false;

        return provScopes.Contains(provinceId.Value);
    }

    public static bool ValidateBlogInputScope(
        ICurrentUserService currentUser,
        int? categoryId)
    {
        if (currentUser.IsSystemAdmin) return true;

        var catScopes = currentUser.CategoryScopes;
        if (catScopes.Count == 0 || !categoryId.HasValue) return false;

        return catScopes.Contains(categoryId.Value);
    }

    public static void EnsurePlaceInputScope(
        ICurrentUserService currentUser,
        int categoryId,
        int provinceId,
        string? errorMessage = null)
    {
        if (!ValidatePlaceInputScope(currentUser, categoryId, provinceId))
        {
            throw new UnauthorizedAccessException(
                errorMessage ?? "Bạn không có quyền thao tác với địa điểm ngoài phạm vi danh mục hoặc tỉnh/thành phố quản lý.");
        }
    }

    public static void EnsureFoodInputScope(
        ICurrentUserService currentUser,
        int? provinceId,
        string? errorMessage = null)
    {
        if (!ValidateFoodInputScope(currentUser, provinceId))
        {
            throw new UnauthorizedAccessException(
                errorMessage ?? "Bạn không có quyền thao tác với món ăn ngoài phạm vi tỉnh/thành phố quản lý.");
        }
    }

    public static void EnsureBlogInputScope(
        ICurrentUserService currentUser,
        int? categoryId,
        string? errorMessage = null)
    {
        if (!ValidateBlogInputScope(currentUser, categoryId))
        {
            throw new UnauthorizedAccessException(
                errorMessage ?? "Bạn không có quyền thao tác với bài viết ngoài phạm vi danh mục quản lý.");
        }
    }
}
