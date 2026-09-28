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
        var regScopes = currentUser.RegionScopes;

        if (catScopes.Count == 0 && provScopes.Count == 0 && regScopes.Count == 0)
        {
            whereClauses.Add("1 = 0");
            return;
        }

        if (catScopes.Count > 0)
        {
            whereClauses.Add($"{placeAlias}.CategoryId IN @ScopeCategoryIds");
            parameters.Add("ScopeCategoryIds", catScopes);
        }

        if (provScopes.Count > 0 && regScopes.Count > 0)
        {
            whereClauses.Add($"({placeAlias}.ProvinceId IN @ScopeProvinceIds OR {provinceAlias}.RegionId IN @ScopeRegionIds)");
            parameters.Add("ScopeProvinceIds", provScopes);
            parameters.Add("ScopeRegionIds", regScopes);
        }
        else if (provScopes.Count > 0)
        {
            whereClauses.Add($"{placeAlias}.ProvinceId IN @ScopeProvinceIds");
            parameters.Add("ScopeProvinceIds", provScopes);
        }
        else if (regScopes.Count > 0)
        {
            whereClauses.Add($"{provinceAlias}.RegionId IN @ScopeRegionIds");
            parameters.Add("ScopeRegionIds", regScopes);
        }
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

        var catScopes = currentUser.CategoryScopes;
        var provScopes = currentUser.ProvinceScopes;
        var regScopes = currentUser.RegionScopes;

        if (catScopes.Count == 0 && provScopes.Count == 0 && regScopes.Count == 0)
        {
            whereClauses.Add("1 = 0");
            return;
        }

        var conditions = new List<string>();

        if (catScopes.Count > 0)
        {
            conditions.Add($"EXISTS (SELECT 1 FROM dbo.FoodPlaces fp_pl JOIN dbo.Places pl ON fp_pl.PlaceId = pl.Id WHERE fp_pl.FoodId = {foodAlias}.Id AND pl.CategoryId IN @ScopeCategoryIds)");
            parameters.Add("ScopeCategoryIds", catScopes);
        }

        if (provScopes.Count > 0)
        {
            conditions.Add($"EXISTS (SELECT 1 FROM dbo.FoodProvinces fp_pr WHERE fp_pr.FoodId = {foodAlias}.Id AND fp_pr.ProvinceId IN @ScopeProvinceIds)");
            parameters.Add("ScopeProvinceIds", provScopes);
        }

        if (regScopes.Count > 0)
        {
            conditions.Add($"EXISTS (SELECT 1 FROM dbo.FoodProvinces fp_r JOIN dbo.Provinces prov ON fp_r.ProvinceId = prov.Id WHERE fp_r.FoodId = {foodAlias}.Id AND prov.RegionId IN @ScopeRegionIds)");
            parameters.Add("ScopeRegionIds", regScopes);
        }

        if (conditions.Count > 0)
        {
            whereClauses.Add("(" + string.Join(" OR ", conditions) + ")");
        }
    }

    public static async Task<bool> IsPlaceInScopeAsync(
        ICurrentUserService currentUser,
        IDbConnection connection,
        long placeId)
    {
        if (currentUser.IsSystemAdmin) return true;

        const string sql = @"
            SELECT p.CategoryId, p.ProvinceId, prov.RegionId 
            FROM dbo.Places p 
            LEFT JOIN dbo.Provinces prov ON p.ProvinceId = prov.Id 
            WHERE p.Id = @Id;";

        var place = await connection.QueryFirstOrDefaultAsync<(int CategoryId, int ProvinceId, int? RegionId)?>(sql, new { Id = placeId });
        if (place == null) return false;

        var catScopes = currentUser.CategoryScopes;
        var provScopes = currentUser.ProvinceScopes;
        var regScopes = currentUser.RegionScopes;

        if (catScopes.Count == 0 && provScopes.Count == 0 && regScopes.Count == 0) return false;

        if (catScopes.Count > 0 && !catScopes.Contains(place.Value.CategoryId)) return false;

        if (provScopes.Count > 0 && regScopes.Count > 0)
        {
            if (!provScopes.Contains(place.Value.ProvinceId) &&
                (!place.Value.RegionId.HasValue || !regScopes.Contains(place.Value.RegionId.Value)))
                return false;
        }
        else if (provScopes.Count > 0 && !provScopes.Contains(place.Value.ProvinceId))
        {
            return false;
        }
        else if (regScopes.Count > 0 && (!place.Value.RegionId.HasValue || !regScopes.Contains(place.Value.RegionId.Value)))
        {
            return false;
        }

        return true;
    }

    public static async Task<bool> IsBlogInScopeAsync(
        ICurrentUserService currentUser,
        IDbConnection connection,
        long blogId)
    {
        if (currentUser.IsSystemAdmin) return true;

        const string sql = "SELECT CategoryId FROM dbo.Blogs WHERE Id = @Id;";
        var categoryId = await connection.QueryFirstOrDefaultAsync<int?>(sql, new { Id = blogId });
        if (!categoryId.HasValue) return false;

        var catScopes = currentUser.CategoryScopes;
        return catScopes.Contains(categoryId.Value);
    }
}
