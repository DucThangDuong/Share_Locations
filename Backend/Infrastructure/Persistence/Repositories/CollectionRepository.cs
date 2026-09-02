using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using Dapper;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class CollectionRepository : ICollectionRepository
{
    private readonly TravelReviewDbContext _dbContext;

    public CollectionRepository(TravelReviewDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<CollectionDto>> GetFeaturedCollectionsAsync(int count = 6, CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        const string sql = @"
            SELECT TOP (@Count) c.Id, c.Title, c.Description, c.IsFeatured, c.DisplayOrder,
                   (SELECT COUNT(1) FROM dbo.CollectionPlaces cp WHERE cp.CollectionId = c.Id) AS PlaceCount,
                   (SELECT TOP 1 pm.Url 
                    FROM dbo.CollectionPlaces cp 
                    INNER JOIN dbo.PlaceMedia pm ON cp.PlaceId = pm.PlaceId 
                    WHERE cp.CollectionId = c.Id AND pm.IsVerified = 1 
                    ORDER BY cp.DisplayOrder, pm.DisplayOrder) AS CoverUrl
            FROM dbo.Collections c
            WHERE c.Status = 1 AND c.IsFeatured = 1
            ORDER BY c.DisplayOrder;";

        var collections = await connection.QueryAsync<CollectionDto>(sql, new { Count = count });
        return collections.ToList();
    }
}
