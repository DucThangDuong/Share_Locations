using Application.Common.Interfaces.Repositories;
using Application.DTOs.Admin;
using Dapper;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class AdminDashboardRepository : IAdminDashboardRepository
{
    private readonly TravelReviewDbContext _dbContext;

    public AdminDashboardRepository(TravelReviewDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<AdminDashboardMetricsDto> GetDashboardMetricsAsync(CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        const string summarySql = @"
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
                (SELECT COUNT(1) FROM dbo.Reviews WHERE Status = 2 OR Id IN (SELECT ReviewId FROM dbo.ReviewReports WHERE Status = 0)) AS ReportedReviews,
                (SELECT COUNT(1) FROM dbo.Foods) AS TotalFoods,
                (SELECT COUNT(1) FROM dbo.Blogs) AS TotalBlogs;";

        var summary = await connection.QueryFirstOrDefaultAsync<AdminDashboardSummaryDto>(summarySql)
            ?? new AdminDashboardSummaryDto();

        const string provinceStatsSql = @"
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
            GROUP BY prov.Name
            ORDER BY COUNT(p.Id) DESC;";

        var provinceStats = (await connection.QueryAsync<AdminProvinceStatDto>(provinceStatsSql)).ToList();

        return new AdminDashboardMetricsDto
        {
            Summary = summary,
            ProvinceStats = provinceStats
        };
    }

    public async Task<IReadOnlyList<AdminProvinceCompletenessDto>> GetProvincesCompletenessAsync(CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        const string sql = @"
            SELECT 
                prov.Id,
                prov.Name,
                COUNT(DISTINCT p.Id) AS PlacesCount,
                (SELECT COUNT(1) FROM dbo.FoodProvinces fp WHERE fp.ProvinceId = prov.Id) AS FoodsCount,
                CASE 
                    WHEN COUNT(DISTINCT p.Id) >= 25 THEN 90
                    WHEN COUNT(DISTINCT p.Id) >= 15 THEN 75
                    WHEN COUNT(DISTINCT p.Id) >= 5 THEN 50
                    ELSE 25
                END AS CompletenessPercent
            FROM dbo.Provinces prov
            LEFT JOIN dbo.Places p ON prov.Id = p.ProvinceId
            GROUP BY prov.Id, prov.Name
            ORDER BY COUNT(DISTINCT p.Id) DESC, prov.Name ASC;";

        var rows = await connection.QueryAsync<AdminProvinceCompletenessDto>(sql);
        return rows.ToList();
    }

    public async Task<IReadOnlyList<AdminCategoryDto>> GetCategoriesAsync(CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();
        const string sql = "SELECT Id, Name, Slug, IconUrl, DisplayOrder FROM dbo.Categories ORDER BY DisplayOrder, Name;";
        var rows = await connection.QueryAsync<AdminCategoryDto>(sql);
        return rows.ToList();
    }
}
