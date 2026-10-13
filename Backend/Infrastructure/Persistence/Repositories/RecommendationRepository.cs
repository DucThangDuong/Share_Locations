using System.Data;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using Dapper;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class RecommendationRepository : IRecommendationRepository
{
    private readonly TravelReviewDbContext _dbContext;

    public RecommendationRepository(TravelReviewDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<PlaceRecommendationDto>> GetAllCandidatePlacesAsync(CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();
        const string sql = @"
            SELECT
                p.Id,
                p.Name,
                p.Address,
                p.CategoryId,
                c.Name AS CategoryName,
                p.ProvinceId,
                pr.Name AS ProvinceName,
                CAST(p.AvgRating AS DECIMAL(3,2)) AS AvgRating,
                p.ReviewCount,
                p.MinPrice,
                p.MaxPrice,
                COALESCE(NULLIF(p.CoverImageUrl, ''), (SELECT TOP 1 pm.Url FROM dbo.PlaceMedia pm WHERE pm.PlaceId = p.Id ORDER BY pm.DisplayOrder)) AS CoverImageUrl
            FROM dbo.Places p
            LEFT JOIN dbo.Categories c ON p.CategoryId = c.Id
            LEFT JOIN dbo.Provinces pr ON p.ProvinceId = pr.Id
            WHERE p.Status = 1 AND p.IsDeleted = 0;";

        var command = new CommandDefinition(sql, cancellationToken: ct);
        var places = await connection.QueryAsync<PlaceRecommendationDto>(command);
        return places.AsList();
    }

    public async Task<List<UserReviewFeatureDto>> GetAllReviewsAsync(CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();
        const string sql = @"
            SELECT
                UserId,
                PlaceId,
                CAST(Rating AS FLOAT) AS Rating
            FROM dbo.Reviews
            WHERE Status = 1;";

        var command = new CommandDefinition(sql, cancellationToken: ct);
        var reviews = await connection.QueryAsync<UserReviewFeatureDto>(command);
        return reviews.AsList();
    }
}
