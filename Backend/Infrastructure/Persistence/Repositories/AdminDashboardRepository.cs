using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs.Admin;
using Dapper;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class AdminDashboardRepository : IAdminDashboardRepository
{
    private readonly TravelReviewDbContext _dbContext;
    private readonly ICurrentUserService _currentUserService;

    public AdminDashboardRepository(TravelReviewDbContext dbContext, ICurrentUserService currentUserService)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
    }

    public async Task<AdminDashboardMetricsDto> GetDashboardMetricsAsync(CancellationToken ct = default)
    {
        var parameters = new DynamicParameters();
        string combinedSql;

        if (_currentUserService.IsSystemAdmin)
        {
            combinedSql = @"
            -- 1. Lấy dữ liệu tổng quan (Metrics Summary)
            SELECT 
                (SELECT COUNT(1) FROM dbo.Places) AS TotalPlaces,
                (SELECT COUNT(1) FROM dbo.Proposals WHERE Status = 0) AS NewProposalsPending,
                (
                    (SELECT COUNT(1) FROM dbo.PlaceReports WHERE Status = 0) +
                    (SELECT COUNT(1) FROM dbo.ReviewReports WHERE Status = 0) +
                    (SELECT COUNT(1) FROM dbo.CommentReports WHERE Status = 0) +
                    (SELECT COUNT(1) FROM dbo.BlogReports WHERE Status = 0)
                ) AS UnresolvedReports,
                0 AS UrgentSlaBreached,
                (SELECT COUNT(1) FROM dbo.Reviews) AS TotalReviews,
                (
                    SELECT COUNT(1) 
                    FROM dbo.Reviews r
                    WHERE r.Status = 2 
                       OR EXISTS (SELECT 1 FROM dbo.ReviewReports rr WHERE rr.ReviewId = r.Id AND rr.Status = 0)
                ) AS ReportedReviews,
                (SELECT COUNT(1) FROM dbo.Foods) AS TotalFoods,
                (SELECT COUNT(1) FROM dbo.Blogs) AS TotalBlogs;

            -- 2. Lấy Top 5 tỉnh/thành có nhiều địa điểm nhất
            SELECT TOP 5
                prov.Name AS Province,
                COUNT(p.Id) AS PlacesCount,
                CASE 
                    WHEN COUNT(p.Id) >= 30 THEN 95
                    WHEN COUNT(p.Id) >= 20 THEN 85
                    WHEN COUNT(p.Id) >= 10 THEN 70
                    ELSE 50
                END AS Completeness
            FROM dbo.Provinces prov
            LEFT JOIN dbo.Places p ON prov.Id = p.ProvinceId
            GROUP BY prov.Id, prov.Name
            ORDER BY COUNT(p.Id) DESC;";
        }
        else
        {
            var catScopes = _currentUserService.CategoryScopes;
            var provScopes = _currentUserService.ProvinceScopes;
            var regScopes = _currentUserService.RegionScopes;

            parameters.Add("ScopeCatIds", catScopes);
            parameters.Add("ScopeProvIds", provScopes);
            parameters.Add("ScopeRegIds", regScopes);

            // Điều kiện lọc Scope cho Places
            var placeConds = new List<string>();
            if (catScopes.Count > 0) placeConds.Add("p.CategoryId IN @ScopeCatIds");
            if (provScopes.Count > 0 && regScopes.Count > 0)
                placeConds.Add("(p.ProvinceId IN @ScopeProvIds OR prov.RegionId IN @ScopeRegIds)");
            else if (provScopes.Count > 0)
                placeConds.Add("p.ProvinceId IN @ScopeProvIds");
            else if (regScopes.Count > 0)
                placeConds.Add("prov.RegionId IN @ScopeRegIds");
            else if (catScopes.Count == 0)
                placeConds.Add("1 = 0");

            var placeWhere = placeConds.Count > 0 ? " WHERE " + string.Join(" AND ", placeConds) : "";

            // Blogs
            var blogWhere = catScopes.Count > 0 ? " WHERE b.CategoryId IN @ScopeCatIds" : " WHERE 1 = 0";

            // Foods
            var foodConds = new List<string>();
            if (catScopes.Count > 0)
                foodConds.Add("EXISTS (SELECT 1 FROM dbo.FoodPlaces fp_pl JOIN dbo.Places pl ON fp_pl.PlaceId = pl.Id WHERE fp_pl.FoodId = f.Id AND pl.CategoryId IN @ScopeCatIds)");
            if (provScopes.Count > 0)
                foodConds.Add("EXISTS (SELECT 1 FROM dbo.FoodProvinces fp WHERE fp.FoodId = f.Id AND fp.ProvinceId IN @ScopeProvIds)");
            if (regScopes.Count > 0)
                foodConds.Add("EXISTS (SELECT 1 FROM dbo.FoodProvinces fp JOIN dbo.Provinces prov ON fp.ProvinceId = prov.Id WHERE fp.FoodId = f.Id AND prov.RegionId IN @ScopeRegIds)");
            if (foodConds.Count == 0) foodConds.Add("1 = 0");
            var foodWhere = " WHERE (" + string.Join(" OR ", foodConds) + ")";

            // Proposals
            var propConds = new List<string> { "prop.Status = 0" };
            if (catScopes.Count > 0)
                propConds.Add("COALESCE(prop.CategoryId, targetP.CategoryId) IN @ScopeCatIds");
            if (provScopes.Count > 0 && regScopes.Count > 0)
                propConds.Add("(COALESCE(prop.ProvinceId, targetP.ProvinceId) IN @ScopeProvIds OR prov.RegionId IN @ScopeRegIds)");
            else if (provScopes.Count > 0)
                propConds.Add("COALESCE(prop.ProvinceId, targetP.ProvinceId) IN @ScopeProvIds");
            else if (regScopes.Count > 0)
                propConds.Add("prov.RegionId IN @ScopeRegIds");
            else if (catScopes.Count == 0)
                propConds.Add("1 = 0");
            var propWhere = " WHERE " + string.Join(" AND ", propConds);

            // Province stats filter
            var provStatsWhere = "";
            if (provScopes.Count > 0 && regScopes.Count > 0)
                provStatsWhere = " WHERE prov.Id IN @ScopeProvIds OR prov.RegionId IN @ScopeRegIds";
            else if (provScopes.Count > 0)
                provStatsWhere = " WHERE prov.Id IN @ScopeProvIds";
            else if (regScopes.Count > 0)
                provStatsWhere = " WHERE prov.RegionId IN @ScopeRegIds";

            combinedSql = $@"
            -- 1. Lấy dữ liệu tổng quan có phân quyền Scope
            SELECT 
                (SELECT COUNT(1) FROM dbo.Places p LEFT JOIN dbo.Provinces prov ON p.ProvinceId = prov.Id {placeWhere}) AS TotalPlaces,
                (SELECT COUNT(1) FROM dbo.Proposals prop LEFT JOIN dbo.Places targetP ON prop.TargetPlaceId = targetP.Id LEFT JOIN dbo.Provinces prov ON COALESCE(prop.ProvinceId, targetP.ProvinceId) = prov.Id {propWhere}) AS NewProposalsPending,
                (
                    (SELECT COUNT(1) FROM dbo.PlaceReports pr JOIN dbo.Places p ON pr.PlaceId = p.Id LEFT JOIN dbo.Provinces prov ON p.ProvinceId = prov.Id {placeWhere} AND pr.Status = 0) +
                    (SELECT COUNT(1) FROM dbo.ReviewReports rr JOIN dbo.Reviews r ON rr.ReviewId = r.Id JOIN dbo.Places p ON r.PlaceId = p.Id LEFT JOIN dbo.Provinces prov ON p.ProvinceId = prov.Id {placeWhere} AND rr.Status = 0) +
                    (SELECT COUNT(1) FROM dbo.CommentReports cr JOIN dbo.Comments c ON cr.CommentId = c.Id JOIN dbo.Reviews r ON c.ReviewId = r.Id JOIN dbo.Places p ON r.PlaceId = p.Id LEFT JOIN dbo.Provinces prov ON p.ProvinceId = prov.Id {placeWhere} AND cr.Status = 0) +
                    (SELECT COUNT(1) FROM dbo.BlogReports br JOIN dbo.Blogs b ON br.BlogId = b.Id {blogWhere} AND br.Status = 0)
                ) AS UnresolvedReports,
                0 AS UrgentSlaBreached,
                (SELECT COUNT(1) FROM dbo.Reviews r JOIN dbo.Places p ON r.PlaceId = p.Id LEFT JOIN dbo.Provinces prov ON p.ProvinceId = prov.Id {placeWhere}) AS TotalReviews,
                (
                    SELECT COUNT(1) 
                    FROM dbo.Reviews r
                    JOIN dbo.Places p ON r.PlaceId = p.Id
                    LEFT JOIN dbo.Provinces prov ON p.ProvinceId = prov.Id
                    {placeWhere} {(string.IsNullOrWhiteSpace(placeWhere) ? "WHERE" : "AND")} (r.Status = 2 OR EXISTS (SELECT 1 FROM dbo.ReviewReports rr WHERE rr.ReviewId = r.Id AND rr.Status = 0))
                ) AS ReportedReviews,
                (SELECT COUNT(1) FROM dbo.Foods f {foodWhere}) AS TotalFoods,
                (SELECT COUNT(1) FROM dbo.Blogs b {blogWhere}) AS TotalBlogs;

            -- 2. Top tỉnh/thành theo phạm vi phụ trách
            SELECT TOP 5
                prov.Name AS Province,
                COUNT(p.Id) AS PlacesCount,
                CASE 
                    WHEN COUNT(p.Id) >= 30 THEN 95
                    WHEN COUNT(p.Id) >= 20 THEN 85
                    WHEN COUNT(p.Id) >= 10 THEN 70
                    ELSE 50
                END AS Completeness
            FROM dbo.Provinces prov
            LEFT JOIN dbo.Places p ON prov.Id = p.ProvinceId {(catScopes.Count > 0 ? "AND p.CategoryId IN @ScopeCatIds" : "")}
            {provStatsWhere}
            GROUP BY prov.Id, prov.Name
            ORDER BY COUNT(p.Id) DESC;";
        }

        var strategy = _dbContext.Database.CreateExecutionStrategy();

        return await strategy.ExecuteAsync(async () =>
        {
            var connection = _dbContext.Database.GetDbConnection();
            var wasClosed = connection.State == System.Data.ConnectionState.Closed;

            if (wasClosed)
            {
                await connection.OpenAsync(ct);
            }

            try
            {
                var command = new CommandDefinition(combinedSql, parameters, cancellationToken: ct);
                using var multi = await connection.QueryMultipleAsync(command);
                var summary = await multi.ReadFirstOrDefaultAsync<AdminDashboardSummaryDto>()
                              ?? new AdminDashboardSummaryDto();
                var provinceStats = (await multi.ReadAsync<AdminProvinceStatDto>()).ToList();

                return new AdminDashboardMetricsDto
                {
                    Summary = summary,
                    ProvinceStats = provinceStats
                };
            }
            finally
            {
                if (wasClosed)
                {
                    await connection.CloseAsync();
                }
            }
        });
    }

    public async Task<IReadOnlyList<AdminProvinceCompletenessDto>> GetProvincesCompletenessAsync(CancellationToken ct = default)
    {
        var parameters = new DynamicParameters();
        var whereSql = "";

        if (!_currentUserService.IsSystemAdmin)
        {
            var provScopes = _currentUserService.ProvinceScopes;
            var regScopes = _currentUserService.RegionScopes;
            if (provScopes.Count > 0 && regScopes.Count > 0)
            {
                whereSql = " WHERE prov.Id IN @ScopeProvIds OR prov.RegionId IN @ScopeRegIds";
                parameters.Add("ScopeProvIds", provScopes);
                parameters.Add("ScopeRegIds", regScopes);
            }
            else if (provScopes.Count > 0)
            {
                whereSql = " WHERE prov.Id IN @ScopeProvIds";
                parameters.Add("ScopeProvIds", provScopes);
            }
            else if (regScopes.Count > 0)
            {
                whereSql = " WHERE prov.RegionId IN @ScopeRegIds";
                parameters.Add("ScopeRegIds", regScopes);
            }
        }

        var sql = $@"
        SELECT 
            prov.Id,
            prov.Name,
            COUNT(p.Id) AS PlacesCount,
            (SELECT COUNT(1) FROM dbo.FoodProvinces fp WHERE fp.ProvinceId = prov.Id) AS FoodsCount,
            CASE 
                WHEN COUNT(p.Id) >= 25 THEN 90
                WHEN COUNT(p.Id) >= 15 THEN 75
                WHEN COUNT(p.Id) >= 5 THEN 50
                ELSE 25
            END AS CompletenessPercent
        FROM dbo.Provinces prov
        LEFT JOIN dbo.Places p ON prov.Id = p.ProvinceId
        {whereSql}
        GROUP BY prov.Id, prov.Name
        ORDER BY COUNT(p.Id) DESC, prov.Name ASC;";

        var strategy = _dbContext.Database.CreateExecutionStrategy();

        return await strategy.ExecuteAsync(async () =>
        {
            var connection = _dbContext.Database.GetDbConnection();
            var command = new CommandDefinition(sql, parameters, cancellationToken: ct);
            var rows = await connection.QueryAsync<AdminProvinceCompletenessDto>(command);
            return rows.ToList();
        });
    }

    public async Task<IReadOnlyList<AdminCategoryDto>> GetCategoriesAsync(CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();
        string sql = "SELECT Id, Name, Slug, IconUrl, DisplayOrder FROM dbo.Categories";
        var parameters = new DynamicParameters();

        if (!_currentUserService.IsSystemAdmin && _currentUserService.CategoryScopes.Count > 0)
        {
            sql += " WHERE Id IN @CategoryScopes";
            parameters.Add("CategoryScopes", _currentUserService.CategoryScopes);
        }

        sql += " ORDER BY DisplayOrder, Name;";
        var rows = await connection.QueryAsync<AdminCategoryDto>(sql, parameters);
        return rows.ToList();
    }
}
