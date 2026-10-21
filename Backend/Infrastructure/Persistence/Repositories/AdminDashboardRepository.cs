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
                (SELECT COUNT(1) FROM dbo.Places WHERE IsDeleted = 0) AS TotalPlaces,
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
            LEFT JOIN dbo.Places p ON prov.Id = p.ProvinceId AND p.IsDeleted = 0
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

            var placeConds = new List<string> { "p.IsDeleted = 0" };
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

            var blogWhere = catScopes.Count > 0 ? " WHERE b.CategoryId IN @ScopeCatIds" : " WHERE 1 = 0";

            var foodConds = new List<string>();
            if (catScopes.Count > 0)
                foodConds.Add("EXISTS (SELECT 1 FROM dbo.FoodPlaces fp_pl JOIN dbo.Places pl ON fp_pl.PlaceId = pl.Id WHERE fp_pl.FoodId = f.Id AND pl.IsDeleted = 0 AND pl.CategoryId IN @ScopeCatIds)");
            if (provScopes.Count > 0)
                foodConds.Add("EXISTS (SELECT 1 FROM dbo.FoodProvinces fp WHERE fp.FoodId = f.Id AND fp.ProvinceId IN @ScopeProvIds)");
            if (regScopes.Count > 0)
                foodConds.Add("EXISTS (SELECT 1 FROM dbo.FoodProvinces fp JOIN dbo.Provinces prov ON fp.ProvinceId = prov.Id WHERE fp.FoodId = f.Id AND prov.RegionId IN @ScopeRegIds)");
            if (foodConds.Count == 0) foodConds.Add("1 = 0");
            var foodWhere = " WHERE (" + string.Join(" OR ", foodConds) + ")";

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
                (SELECT COUNT(1) FROM dbo.Proposals prop LEFT JOIN dbo.Places targetP ON prop.TargetPlaceId = targetP.Id AND targetP.IsDeleted = 0 LEFT JOIN dbo.Provinces prov ON COALESCE(prop.ProvinceId, targetP.ProvinceId) = prov.Id {propWhere}) AS NewProposalsPending,
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
            LEFT JOIN dbo.Places p ON prov.Id = p.ProvinceId AND p.IsDeleted = 0 {(catScopes.Count > 0 ? "AND p.CategoryId IN @ScopeCatIds" : "")}
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
        LEFT JOIN dbo.Places p ON prov.Id = p.ProvinceId AND p.IsDeleted = 0
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

    public async Task<DashboardTrendsResponseDto> GetDashboardTrendsAsync(string? timeRange, string? region, CancellationToken ct = default)
    {
        var range = string.IsNullOrWhiteSpace(timeRange) ? "7days" : timeRange.Trim().ToLowerInvariant();
        var now = DateTime.UtcNow;
        var connection = _dbContext.Database.GetDbConnection();
        var parameters = new DynamicParameters();

        string regionWhere = "";
        if (!string.IsNullOrWhiteSpace(region) && !region.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            var reg = region.Trim().ToLowerInvariant();
            if (reg == "mien_bac" || reg == "north" || reg == "bac")
                regionWhere = " AND (prov.RegionId = 1 OR prov.RegionId IN (SELECT Id FROM dbo.Regions WHERE Slug = 'mien-bac' OR Name LIKE N'%Bắc%'))";
            else if (reg == "mien_trung" || reg == "central" || reg == "trung")
                regionWhere = " AND (prov.RegionId = 2 OR prov.RegionId IN (SELECT Id FROM dbo.Regions WHERE Slug = 'mien-trung' OR Name LIKE N'%Trung%'))";
            else if (reg == "mien_nam" || reg == "south" || reg == "nam")
                regionWhere = " AND (prov.RegionId = 3 OR prov.RegionId IN (SELECT Id FROM dbo.Regions WHERE Slug = 'mien-nam' OR Name LIKE N'%Nam%'))";
        }

        string scopeWhere = "";
        if (!_currentUserService.IsSystemAdmin)
        {
            var catScopes = _currentUserService.CategoryScopes;
            var provScopes = _currentUserService.ProvinceScopes;
            var regScopes = _currentUserService.RegionScopes;
            parameters.Add("ScopeCatIds", catScopes);
            parameters.Add("ScopeProvIds", provScopes);
            parameters.Add("ScopeRegIds", regScopes);

            if (catScopes.Count > 0) scopeWhere += " AND p.CategoryId IN @ScopeCatIds";
            if (provScopes.Count > 0 && regScopes.Count > 0)
                scopeWhere += " AND (p.ProvinceId IN @ScopeProvIds OR prov.RegionId IN @ScopeRegIds)";
            else if (provScopes.Count > 0)
                scopeWhere += " AND p.ProvinceId IN @ScopeProvIds";
            else if (regScopes.Count > 0)
                scopeWhere += " AND prov.RegionId IN @ScopeRegIds";
        }

        DateTime startDate;
        var points = new List<DashboardTrendPointDto>();

        if (range == "today")
        {
            startDate = now.Date;
            parameters.Add("StartDate", startDate);

            for (int h = 0; h < 24; h++)
            {
                var label = $"{h:00}:00";
                points.Add(new DashboardTrendPointDto
                {
                    Timestamp = label,
                    Label = label,
                    ReviewsCount = 0,
                    ReportsCount = 0
                });
            }

            var reviewsSql = $@"
                SELECT DATEPART(hour, r.CreatedAt) AS [TimeKey], COUNT(1) AS [Count]
                FROM dbo.Reviews r
                JOIN dbo.Places p ON r.PlaceId = p.Id AND p.IsDeleted = 0
                LEFT JOIN dbo.Provinces prov ON p.ProvinceId = prov.Id
                WHERE r.CreatedAt >= @StartDate {regionWhere} {scopeWhere}
                GROUP BY DATEPART(hour, r.CreatedAt);";

            var reportsSql = $@"
                SELECT DATEPART(hour, rep.CreatedAt) AS [TimeKey], COUNT(1) AS [Count]
                FROM (
                    SELECT pr.CreatedAt FROM dbo.PlaceReports pr JOIN dbo.Places p ON pr.PlaceId = p.Id LEFT JOIN dbo.Provinces prov ON p.ProvinceId = prov.Id WHERE pr.CreatedAt >= @StartDate AND p.IsDeleted = 0 {regionWhere} {scopeWhere}
                    UNION ALL
                    SELECT rr.CreatedAt FROM dbo.ReviewReports rr JOIN dbo.Reviews r ON rr.ReviewId = r.Id JOIN dbo.Places p ON r.PlaceId = p.Id LEFT JOIN dbo.Provinces prov ON p.ProvinceId = prov.Id WHERE rr.CreatedAt >= @StartDate AND p.IsDeleted = 0 {regionWhere} {scopeWhere}
                    UNION ALL
                    SELECT cr.CreatedAt FROM dbo.CommentReports cr JOIN dbo.Comments c ON cr.CommentId = c.Id JOIN dbo.Reviews r ON c.ReviewId = r.Id JOIN dbo.Places p ON r.PlaceId = p.Id LEFT JOIN dbo.Provinces prov ON p.ProvinceId = prov.Id WHERE cr.CreatedAt >= @StartDate AND p.IsDeleted = 0 {regionWhere} {scopeWhere}
                    UNION ALL
                    SELECT br.CreatedAt FROM dbo.BlogReports br WHERE br.CreatedAt >= @StartDate
                ) rep
                GROUP BY DATEPART(hour, rep.CreatedAt);";

            var reviewRows = (await connection.QueryAsync<(int TimeKey, int Count)>(reviewsSql, parameters)).ToDictionary(x => x.TimeKey, x => x.Count);
            var reportRows = (await connection.QueryAsync<(int TimeKey, int Count)>(reportsSql, parameters)).ToDictionary(x => x.TimeKey, x => x.Count);

            for (int h = 0; h < 24; h++)
            {
                if (reviewRows.TryGetValue(h, out var rCount)) points[h].ReviewsCount = rCount;
                if (reportRows.TryGetValue(h, out var repCount)) points[h].ReportsCount = repCount;
            }
        }
        else
        {
            int days = range switch
            {
                "30days" => 30,
                "90days" => 90,
                _ => 7
            };

            startDate = now.Date.AddDays(-(days - 1));
            parameters.Add("StartDate", startDate);

            var pointLookup = new Dictionary<string, DashboardTrendPointDto>();
            for (int i = 0; i < days; i++)
            {
                var dt = startDate.AddDays(i);
                var ts = dt.ToString("yyyy-MM-dd");
                var label = days == 7 ? GetVietnameseDayName(dt.DayOfWeek) : dt.ToString("dd/MM");
                var pt = new DashboardTrendPointDto
                {
                    Timestamp = ts,
                    Label = label,
                    ReviewsCount = 0,
                    ReportsCount = 0
                };
                points.Add(pt);
                pointLookup[ts] = pt;
            }

            var reviewsSql = $@"
                SELECT CONVERT(VARCHAR(10), r.CreatedAt, 120) AS [TimeKey], COUNT(1) AS [Count]
                FROM dbo.Reviews r
                JOIN dbo.Places p ON r.PlaceId = p.Id AND p.IsDeleted = 0
                LEFT JOIN dbo.Provinces prov ON p.ProvinceId = prov.Id
                WHERE r.CreatedAt >= @StartDate {regionWhere} {scopeWhere}
                GROUP BY CONVERT(VARCHAR(10), r.CreatedAt, 120);";

            var reportsSql = $@"
                SELECT CONVERT(VARCHAR(10), rep.CreatedAt, 120) AS [TimeKey], COUNT(1) AS [Count]
                FROM (
                    SELECT pr.CreatedAt FROM dbo.PlaceReports pr JOIN dbo.Places p ON pr.PlaceId = p.Id LEFT JOIN dbo.Provinces prov ON p.ProvinceId = prov.Id WHERE pr.CreatedAt >= @StartDate AND p.IsDeleted = 0 {regionWhere} {scopeWhere}
                    UNION ALL
                    SELECT rr.CreatedAt FROM dbo.ReviewReports rr JOIN dbo.Reviews r ON rr.ReviewId = r.Id JOIN dbo.Places p ON r.PlaceId = p.Id LEFT JOIN dbo.Provinces prov ON p.ProvinceId = prov.Id WHERE rr.CreatedAt >= @StartDate AND p.IsDeleted = 0 {regionWhere} {scopeWhere}
                    UNION ALL
                    SELECT cr.CreatedAt FROM dbo.CommentReports cr JOIN dbo.Comments c ON cr.CommentId = c.Id JOIN dbo.Reviews r ON c.ReviewId = r.Id JOIN dbo.Places p ON r.PlaceId = p.Id LEFT JOIN dbo.Provinces prov ON p.ProvinceId = prov.Id WHERE cr.CreatedAt >= @StartDate AND p.IsDeleted = 0 {regionWhere} {scopeWhere}
                    UNION ALL
                    SELECT br.CreatedAt FROM dbo.BlogReports br WHERE br.CreatedAt >= @StartDate
                ) rep
                GROUP BY CONVERT(VARCHAR(10), rep.CreatedAt, 120);";

            var reviewRows = await connection.QueryAsync<(string TimeKey, int Count)>(reviewsSql, parameters);
            foreach (var r in reviewRows)
            {
                if (r.TimeKey != null && pointLookup.TryGetValue(r.TimeKey, out var pt))
                    pt.ReviewsCount = r.Count;
            }

            var reportRows = await connection.QueryAsync<(string TimeKey, int Count)>(reportsSql, parameters);
            foreach (var r in reportRows)
            {
                if (r.TimeKey != null && pointLookup.TryGetValue(r.TimeKey, out var pt))
                    pt.ReportsCount = r.Count;
            }
        }

        return new DashboardTrendsResponseDto
        {
            TimeRange = range,
            Points = points
        };
    }

    public async Task<SlaPerformanceResponseDto> GetSlaPerformanceAsync(CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();
        var parameters = new DynamicParameters();

        string scopeWherePlaces = "";
        string scopeWhereProps = "";
        if (!_currentUserService.IsSystemAdmin)
        {
            var catScopes = _currentUserService.CategoryScopes;
            var provScopes = _currentUserService.ProvinceScopes;
            var regScopes = _currentUserService.RegionScopes;
            parameters.Add("ScopeCatIds", catScopes);
            parameters.Add("ScopeProvIds", provScopes);
            parameters.Add("ScopeRegIds", regScopes);

            if (catScopes.Count > 0)
            {
                scopeWherePlaces += " AND p.CategoryId IN @ScopeCatIds";
                scopeWhereProps += " AND COALESCE(prop.CategoryId, targetP.CategoryId) IN @ScopeCatIds";
            }
            if (provScopes.Count > 0 && regScopes.Count > 0)
            {
                scopeWherePlaces += " AND (p.ProvinceId IN @ScopeProvIds OR prov.RegionId IN @ScopeRegIds)";
                scopeWhereProps += " AND (COALESCE(prop.ProvinceId, targetP.ProvinceId) IN @ScopeProvIds OR prov.RegionId IN @ScopeRegIds)";
            }
            else if (provScopes.Count > 0)
            {
                scopeWherePlaces += " AND p.ProvinceId IN @ScopeProvIds";
                scopeWhereProps += " AND COALESCE(prop.ProvinceId, targetP.ProvinceId) IN @ScopeProvIds";
            }
            else if (regScopes.Count > 0)
            {
                scopeWherePlaces += " AND prov.RegionId IN @ScopeRegIds";
                scopeWhereProps += " AND prov.RegionId IN @ScopeRegIds";
            }
        }

        const string sql = @"
            -- 1. Proposals SLA
            SELECT
                COUNT(1) AS Total,
                COUNT(CASE WHEN prop.Status = 1 THEN 1 END) AS Approved,
                COUNT(CASE WHEN prop.Status = 0 THEN 1 END) AS PendingInspection
            FROM dbo.Proposals prop
            LEFT JOIN dbo.Places targetP ON prop.TargetPlaceId = targetP.Id AND targetP.IsDeleted = 0
            LEFT JOIN dbo.Provinces prov ON COALESCE(prop.ProvinceId, targetP.ProvinceId) = prov.Id
            WHERE 1=1 {0};

            -- 2. Reports SLA
            SELECT
                COUNT(1) AS TotalReports,
                COUNT(CASE WHEN rep.Status != 0 AND (rep.ResolvedAt IS NULL OR DATEDIFF(hour, rep.CreatedAt, rep.ResolvedAt) <= 48) THEN 1 END) AS ResolvedWithinSla,
                COUNT(CASE WHEN rep.Status = 0 AND DATEDIFF(hour, rep.CreatedAt, SYSUTCDATETIME()) < 24 THEN 1 END) AS OpenUnder24h
            FROM (
                SELECT pr.Status, pr.CreatedAt, pr.ResolvedAt FROM dbo.PlaceReports pr JOIN dbo.Places p ON pr.PlaceId = p.Id LEFT JOIN dbo.Provinces prov ON p.ProvinceId = prov.Id WHERE p.IsDeleted = 0 {1}
                UNION ALL
                SELECT rr.Status, rr.CreatedAt, rr.ResolvedAt FROM dbo.ReviewReports rr JOIN dbo.Reviews r ON rr.ReviewId = r.Id JOIN dbo.Places p ON r.PlaceId = p.Id LEFT JOIN dbo.Provinces prov ON p.ProvinceId = prov.Id WHERE p.IsDeleted = 0 {1}
                UNION ALL
                SELECT cr.Status, cr.CreatedAt, cr.ResolvedAt FROM dbo.CommentReports cr JOIN dbo.Comments c ON cr.CommentId = c.Id JOIN dbo.Reviews r ON c.ReviewId = r.Id JOIN dbo.Places p ON r.PlaceId = p.Id LEFT JOIN dbo.Provinces prov ON p.ProvinceId = prov.Id WHERE p.IsDeleted = 0 {1}
                UNION ALL
                SELECT br.Status, br.CreatedAt, br.ResolvedAt FROM dbo.BlogReports br
            ) rep;

            -- 3. Places Data Quality
            SELECT
                COUNT(1) AS TotalPlaces,
                COUNT(CASE WHEN
                    p.Address IS NOT NULL AND LEN(p.Address) >= 5 AND
                    p.Latitude IS NOT NULL AND p.Longitude IS NOT NULL AND
                    p.Description IS NOT NULL AND LEN(p.Description) >= 10
                THEN 1 END) AS QualifiedPlaces
            FROM dbo.Places p
            LEFT JOIN dbo.Provinces prov ON p.ProvinceId = prov.Id
            WHERE p.Status = 1 AND p.IsDeleted = 0 {1};";

        var formattedSql = string.Format(sql, scopeWhereProps, scopeWherePlaces);
        using var multi = await connection.QueryMultipleAsync(formattedSql, parameters);

        var propData = await multi.ReadFirstOrDefaultAsync<(int Total, int Approved, int PendingInspection)>();
        var repData = await multi.ReadFirstOrDefaultAsync<(int TotalReports, int ResolvedWithinSla, int OpenUnder24h)>();
        var placeData = await multi.ReadFirstOrDefaultAsync<(int TotalPlaces, int QualifiedPlaces)>();

        var propPct = propData.Total > 0 ? Math.Round((double)propData.Approved / propData.Total * 100, 1) : 100.0;
        var repPct = repData.TotalReports > 0 ? Math.Round((double)repData.ResolvedWithinSla / repData.TotalReports * 100, 1) : 100.0;
        var placePct = placeData.TotalPlaces > 0 ? Math.Round((double)placeData.QualifiedPlaces / placeData.TotalPlaces * 100, 1) : 100.0;

        var missingCount = Math.Max(0, placeData.TotalPlaces - placeData.QualifiedPlaces);
        var missingSummary = missingCount > 0
            ? $"Còn {missingCount} địa điểm chưa đầy đủ thông tin hoặc tọa độ."
            : "100% địa điểm đạt chuẩn dữ liệu.";

        return new SlaPerformanceResponseDto
        {
            ProposalsApprovalRate = new ProposalApprovalRateDto
            {
                Approved = propData.Approved,
                Total = propData.Total,
                Percentage = propPct,
                PendingInspection = propData.PendingInspection
            },
            ReportsResolutionSla = new ReportsResolutionSlaDto
            {
                ResolvedWithinSla = repData.ResolvedWithinSla,
                TotalReports = repData.TotalReports,
                Percentage = repPct,
                OpenUnder24h = repData.OpenUnder24h
            },
            PlacesDataQualityRate = new PlacesDataQualityRateDto
            {
                QualifiedPlaces = placeData.QualifiedPlaces,
                TotalPlaces = placeData.TotalPlaces,
                Percentage = placePct,
                MissingInfoSummary = missingSummary
            }
        };
    }

    public async Task<IReadOnlyList<PriorityQueueItemDto>> GetPriorityQueueAsync(string? filter, int limit = 5, CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();
        var f = string.IsNullOrWhiteSpace(filter) ? "all" : filter.Trim().ToLowerInvariant();
        limit = Math.Clamp(limit, 1, 50);

        var items = new List<(PriorityQueueItemDto Item, DateTime CreatedAt)>();
        var parameters = new DynamicParameters();
        parameters.Add("Limit", limit);

        string scopeWhereProps = "";
        string scopeWherePlaces = "";
        if (!_currentUserService.IsSystemAdmin)
        {
            var catScopes = _currentUserService.CategoryScopes;
            var provScopes = _currentUserService.ProvinceScopes;
            var regScopes = _currentUserService.RegionScopes;
            parameters.Add("ScopeCatIds", catScopes);
            parameters.Add("ScopeProvIds", provScopes);
            parameters.Add("ScopeRegIds", regScopes);

            if (catScopes.Count > 0)
            {
                scopeWherePlaces += " AND p.CategoryId IN @ScopeCatIds";
                scopeWhereProps += " AND COALESCE(prop.CategoryId, targetP.CategoryId) IN @ScopeCatIds";
            }
            if (provScopes.Count > 0 && regScopes.Count > 0)
            {
                scopeWherePlaces += " AND (p.ProvinceId IN @ScopeProvIds OR prov.RegionId IN @ScopeRegIds)";
                scopeWhereProps += " AND (COALESCE(prop.ProvinceId, targetP.ProvinceId) IN @ScopeProvIds OR prov.RegionId IN @ScopeRegIds)";
            }
            else if (provScopes.Count > 0)
            {
                scopeWherePlaces += " AND p.ProvinceId IN @ScopeProvIds";
                scopeWhereProps += " AND COALESCE(prop.ProvinceId, targetP.ProvinceId) IN @ScopeProvIds";
            }
            else if (regScopes.Count > 0)
            {
                scopeWherePlaces += " AND prov.RegionId IN @ScopeRegIds";
                scopeWhereProps += " AND prov.RegionId IN @ScopeRegIds";
            }
        }

        if (f == "all" || f == "proposals" || f == "urgent")
        {
            var propSql = $@"
                SELECT TOP (@Limit)
                    CAST(prop.Id AS NVARCHAR(50)) AS Id,
                    'proposals' AS [Type],
                    N'Đề xuất địa điểm' AS Category,
                    CASE WHEN DATEDIFF(hour, prop.CreatedAt, SYSUTCDATETIME()) >= 24 THEN 1 ELSE 0 END AS IsUrgent,
                    ISNULL(JSON_VALUE(prop.ProposedDataJSON, '$.Name'), N'Đề xuất địa điểm mới') AS Title,
                    N'Đề xuất cần xét duyệt bởi Quản trị viên' AS [Description],
                    ISNULL(prov.Name, N'Toàn quốc') AS LocationName,
                    prop.CreatedAt AS CreatedAt,
                    CASE WHEN DATEDIFF(hour, prop.CreatedAt, SYSUTCDATETIME()) >= 24 THEN N'Khẩn cấp' ELSE N'Chờ duyệt' END AS BadgeLabel,
                    CAST(prop.Id AS NVARCHAR(50)) AS TargetId
                FROM dbo.Proposals prop
                LEFT JOIN dbo.Places targetP ON prop.TargetPlaceId = targetP.Id AND targetP.IsDeleted = 0
                LEFT JOIN dbo.Provinces prov ON COALESCE(prop.ProvinceId, targetP.ProvinceId) = prov.Id
                WHERE prop.Status = 0 {scopeWhereProps}
                ORDER BY prop.CreatedAt ASC;";

            var propRows = await connection.QueryAsync<dynamic>(propSql, parameters);
            foreach (var r in propRows)
            {
                bool isUrgent = (int)r.IsUrgent == 1;
                DateTime dt = (DateTime)r.CreatedAt;
                if (f == "urgent" && !isUrgent) continue;

                items.Add((new PriorityQueueItemDto
                {
                    Id = (string)r.Id,
                    Type = (string)r.Type,
                    Category = (string)r.Category,
                    IsUrgent = isUrgent,
                    Title = (string)r.Title,
                    Description = (string)r.Description,
                    LocationName = (string)r.LocationName,
                    TimeAgo = FormatTimeAgo(dt),
                    BadgeLabel = (string)r.BadgeLabel,
                    TargetId = (string)r.TargetId
                }, dt));
            }
        }

        if (f == "all" || f == "reports" || f == "urgent")
        {
            var repSql = $@"
                SELECT TOP (@Limit)
                    CAST(pr.Id AS NVARCHAR(50)) AS Id,
                    'reports' AS [Type],
                    N'Báo cáo địa điểm' AS Category,
                    CASE WHEN DATEDIFF(hour, pr.CreatedAt, SYSUTCDATETIME()) >= 12 THEN 1 ELSE 0 END AS IsUrgent,
                    ISNULL(rt.Name, N'Báo cáo vi phạm nội dung') AS Title,
                    ISNULL(pr.Reason, N'Báo cáo từ người dùng cần xử lý') AS [Description],
                    ISNULL(p.Name, N'Địa điểm') AS LocationName,
                    pr.CreatedAt AS CreatedAt,
                    CASE WHEN DATEDIFF(hour, pr.CreatedAt, SYSUTCDATETIME()) >= 12 THEN N'Quá hạn SLA' ELSE N'Chờ xử lý' END AS BadgeLabel,
                    CAST(pr.Id AS NVARCHAR(50)) AS TargetId
                FROM dbo.PlaceReports pr
                JOIN dbo.Places p ON pr.PlaceId = p.Id AND p.IsDeleted = 0
                LEFT JOIN dbo.ReportTypes rt ON pr.ReportTypeId = rt.Id
                LEFT JOIN dbo.Provinces prov ON p.ProvinceId = prov.Id
                WHERE pr.Status = 0 {scopeWherePlaces}
                ORDER BY pr.CreatedAt ASC;";

            var repRows = await connection.QueryAsync<dynamic>(repSql, parameters);
            foreach (var r in repRows)
            {
                bool isUrgent = (int)r.IsUrgent == 1;
                DateTime dt = (DateTime)r.CreatedAt;
                if (f == "urgent" && !isUrgent) continue;

                items.Add((new PriorityQueueItemDto
                {
                    Id = (string)r.Id,
                    Type = (string)r.Type,
                    Category = (string)r.Category,
                    IsUrgent = isUrgent,
                    Title = (string)r.Title,
                    Description = (string)r.Description,
                    LocationName = (string)r.LocationName,
                    TimeAgo = FormatTimeAgo(dt),
                    BadgeLabel = (string)r.BadgeLabel,
                    TargetId = (string)r.TargetId
                }, dt));
            }
        }

        if (f == "all" || f == "urgent")
        {
            var revSql = $@"
                SELECT TOP (@Limit)
                    CAST(r.Id AS NVARCHAR(50)) AS Id,
                    'reviews' AS [Type],
                    N'Đánh giá tiêu cực' AS Category,
                    CASE WHEN r.Rating = 1 THEN 1 ELSE 0 END AS IsUrgent,
                    CONCAT(N'Đánh giá ', r.Rating, N' sao từ người dùng') AS Title,
                    LEFT(ISNULL(r.Content, N''), 120) AS [Description],
                    ISNULL(p.Name, N'Địa điểm') AS LocationName,
                    r.CreatedAt AS CreatedAt,
                    CASE WHEN r.Rating = 1 THEN N'Cần lưu ý' ELSE N'Đánh giá thấp' END AS BadgeLabel,
                    CAST(r.Id AS NVARCHAR(50)) AS TargetId
                FROM dbo.Reviews r
                JOIN dbo.Places p ON r.PlaceId = p.Id AND p.IsDeleted = 0
                LEFT JOIN dbo.Provinces prov ON p.ProvinceId = prov.Id
                WHERE r.Rating <= 2 AND r.Status = 1 AND r.CreatedAt >= DATEADD(day, -7, SYSUTCDATETIME()) {scopeWherePlaces}
                ORDER BY r.Rating ASC, r.CreatedAt DESC;";

            var revRows = await connection.QueryAsync<dynamic>(revSql, parameters);
            foreach (var r in revRows)
            {
                bool isUrgent = (int)r.IsUrgent == 1;
                DateTime dt = (DateTime)r.CreatedAt;
                if (f == "urgent" && !isUrgent) continue;

                items.Add((new PriorityQueueItemDto
                {
                    Id = (string)r.Id,
                    Type = (string)r.Type,
                    Category = (string)r.Category,
                    IsUrgent = isUrgent,
                    Title = (string)r.Title,
                    Description = (string)r.Description,
                    LocationName = (string)r.LocationName,
                    TimeAgo = FormatTimeAgo(dt),
                    BadgeLabel = (string)r.BadgeLabel,
                    TargetId = (string)r.TargetId
                }, dt));
            }
        }

        return items
            .OrderByDescending(x => x.Item.IsUrgent)
            .ThenByDescending(x => x.CreatedAt)
            .Select(x => x.Item)
            .Take(limit)
            .ToList();
    }

    public async Task<ContributorsSummaryDto> GetContributorsSummaryAsync(CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        const string sql = @"
            -- 1. Active contributors in last 30 days
            SELECT COUNT(DISTINCT UserId)
            FROM (
                SELECT r.UserId FROM dbo.Reviews r WHERE r.CreatedAt >= DATEADD(day, -30, SYSUTCDATETIME())
                UNION
                SELECT prop.UserId FROM dbo.Proposals prop WHERE prop.CreatedAt >= DATEADD(day, -30, SYSUTCDATETIME())
                UNION
                SELECT b.AuthorId AS UserId FROM dbo.Blogs b WHERE b.CreatedAt >= DATEADD(day, -30, SYSUTCDATETIME())
            ) cur;

            -- 2. Previous 30 days
            SELECT COUNT(DISTINCT UserId)
            FROM (
                SELECT r.UserId FROM dbo.Reviews r WHERE r.CreatedAt >= DATEADD(day, -60, SYSUTCDATETIME()) AND r.CreatedAt < DATEADD(day, -30, SYSUTCDATETIME())
                UNION
                SELECT prop.UserId FROM dbo.Proposals prop WHERE prop.CreatedAt >= DATEADD(day, -60, SYSUTCDATETIME()) AND prop.CreatedAt < DATEADD(day, -30, SYSUTCDATETIME())
                UNION
                SELECT b.AuthorId AS UserId FROM dbo.Blogs b WHERE b.CreatedAt >= DATEADD(day, -60, SYSUTCDATETIME()) AND b.CreatedAt < DATEADD(day, -30, SYSUTCDATETIME())
            ) prev;

            -- 3. Top Active Provinces
            SELECT TOP 5
                prov.Name AS ProvinceName,
                COUNT(1) AS ActivityCount
            FROM (
                SELECT p.ProvinceId FROM dbo.Reviews r JOIN dbo.Places p ON r.PlaceId = p.Id WHERE p.IsDeleted = 0 AND r.CreatedAt >= DATEADD(day, -30, SYSUTCDATETIME())
                UNION ALL
                SELECT COALESCE(prop.ProvinceId, p.ProvinceId) AS ProvinceId FROM dbo.Proposals prop LEFT JOIN dbo.Places p ON prop.TargetPlaceId = p.Id AND p.IsDeleted = 0 WHERE prop.CreatedAt >= DATEADD(day, -30, SYSUTCDATETIME())
            ) act
            JOIN dbo.Provinces prov ON act.ProvinceId = prov.Id
            GROUP BY prov.Id, prov.Name
            ORDER BY COUNT(1) DESC;";

        using var multi = await connection.QueryMultipleAsync(sql);
        var currentCount = await multi.ReadFirstOrDefaultAsync<int>();
        var prevCount = await multi.ReadFirstOrDefaultAsync<int>();
        var provRows = (await multi.ReadAsync<(string ProvinceName, int ActivityCount)>()).ToList();

        string growthText;
        if (prevCount > 0)
        {
            var diff = currentCount - prevCount;
            var pct = (int)Math.Round((double)diff / prevCount * 100);
            growthText = $"{(pct >= 0 ? "+" : "")}{pct}% so với tháng trước";
        }
        else if (currentCount > 0)
        {
            growthText = "+100% so với tháng trước";
        }
        else
        {
            growthText = "0% so với tháng trước";
        }

        var totalActivity = provRows.Sum(x => x.ActivityCount);
        var topProvinces = provRows.Select(x => new TopActiveProvinceDto
        {
            ProvinceName = x.ProvinceName,
            ActivityPercentage = totalActivity > 0 ? Math.Round((double)x.ActivityCount / totalActivity * 100, 1) : 0
        }).ToList();

        return new ContributorsSummaryDto
        {
            NewContributorsCount = currentCount,
            GrowthComparisonText = growthText,
            TopActiveProvinces = topProvinces
        };
    }

    private static string GetVietnameseDayName(DayOfWeek dow) => dow switch
    {
        DayOfWeek.Monday => "T2",
        DayOfWeek.Tuesday => "T3",
        DayOfWeek.Wednesday => "T4",
        DayOfWeek.Thursday => "T5",
        DayOfWeek.Friday => "T6",
        DayOfWeek.Saturday => "T7",
        DayOfWeek.Sunday => "CN",
        _ => dow.ToString()
    };

    private static string FormatTimeAgo(DateTime dt)
    {
        var span = DateTime.UtcNow - dt;
        if (span.TotalMinutes < 1) return "Vừa xong";
        if (span.TotalMinutes < 60) return $"{(int)span.TotalMinutes} phút trước";
        if (span.TotalHours < 24) return $"{(int)span.TotalHours} giờ trước";
        if (span.TotalDays < 30) return $"{(int)span.TotalDays} ngày trước";
        return dt.ToString("dd/MM/yyyy");
    }
}
