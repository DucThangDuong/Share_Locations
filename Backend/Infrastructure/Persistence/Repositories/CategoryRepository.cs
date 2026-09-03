using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using Dapper;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class CategoryRepository : ICategoryRepository
{
    private readonly TravelReviewDbContext _dbContext;

    public CategoryRepository(TravelReviewDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    private class PlaceInCategoryRaw
    {
        public int CategoryId { get; set; }
        public long Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal AvgRating { get; set; }
        public int ReviewCount { get; set; }
    }

    private class PlaceMediaRaw
    {
        public long PlaceId { get; set; }
        public string Url { get; set; } = string.Empty;
    }

    public async Task<IReadOnlyList<CategoryDto>> GetAllAsync(int? placeTypeId = null, int placesPerCategory = 6, CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();
        var safeLimit = placesPerCategory is < 1 or > 50 ? 6 : placesPerCategory;

        const string sql = @"
            SELECT c.Id, c.PlaceTypeId, pt.Name AS PlaceTypeName, c.Name, c.IconClass,
                   COALESCE(counts.PlaceCount, 0) AS PlaceCount
            FROM dbo.Categories c
            INNER JOIN dbo.PlaceTypes pt ON c.PlaceTypeId = pt.Id
            LEFT JOIN (
                SELECT pl.CategoryId, COUNT(1) AS PlaceCount
                FROM dbo.Places pl
                WHERE pl.Status = 1
                GROUP BY pl.CategoryId
            ) counts ON counts.CategoryId = c.Id
            WHERE c.Status = 1
              AND (@PlaceTypeId IS NULL OR c.PlaceTypeId = @PlaceTypeId)
            ORDER BY c.Name;

            WITH RankedPlaces AS (
                SELECT p.CategoryId, p.Id, p.Name, p.AvgRating, p.ReviewCount,
                       ROW_NUMBER() OVER (
                           PARTITION BY p.CategoryId 
                           ORDER BY p.AvgRating DESC, p.ReviewCount DESC, p.CreatedAt DESC
                       ) AS RowNum
                FROM dbo.Places p
                INNER JOIN dbo.Categories c ON p.CategoryId = c.Id
                WHERE c.Status = 1 
                  AND p.Status = 1
                  AND (@PlaceTypeId IS NULL OR c.PlaceTypeId = @PlaceTypeId)
            )
            SELECT CategoryId, Id, Name, AvgRating, ReviewCount
            FROM RankedPlaces
            WHERE RowNum <= @Limit
            ORDER BY CategoryId, RowNum;

            WITH RankedPlaces AS (
                SELECT p.Id,
                       ROW_NUMBER() OVER (
                           PARTITION BY p.CategoryId 
                           ORDER BY p.AvgRating DESC, p.ReviewCount DESC, p.CreatedAt DESC
                       ) AS RowNum
                FROM dbo.Places p
                INNER JOIN dbo.Categories c ON p.CategoryId = c.Id
                WHERE c.Status = 1 
                  AND p.Status = 1
                  AND (@PlaceTypeId IS NULL OR c.PlaceTypeId = @PlaceTypeId)
            )
            SELECT pm.PlaceId, pm.Url
            FROM dbo.PlaceMedia pm
            INNER JOIN RankedPlaces rp ON pm.PlaceId = rp.Id
            WHERE rp.RowNum <= @Limit
            ORDER BY pm.PlaceId, pm.DisplayOrder;";

        using var multi = await connection.QueryMultipleAsync(sql, new { PlaceTypeId = placeTypeId, Limit = safeLimit });
        var categories = (await multi.ReadAsync<CategoryDto>()).ToList();
        var places = (await multi.ReadAsync<PlaceInCategoryRaw>()).ToList();
        var medias = (await multi.ReadAsync<PlaceMediaRaw>()).ToList();

        var mediaByPlace = medias.ToLookup(m => m.PlaceId, m => m.Url);

        var placeCards = places.Select(p => new
        {
            p.CategoryId,
            Card = new PlaceCardDto
            {
                Id = p.Id,
                Name = p.Name,
                AvgRating = p.AvgRating,
                ReviewCount = p.ReviewCount,
                MediaUrls = mediaByPlace[p.Id].ToList()
            }
        }).ToLookup(p => p.CategoryId, p => p.Card);

        foreach (var cat in categories)
        {
            cat.Places = placeCards[cat.Id].ToList();
        }

        return categories;
    }
}
