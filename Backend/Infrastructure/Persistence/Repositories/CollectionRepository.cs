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

    private class PlaceInCollectionRaw
    {
        public int CollectionId { get; set; }
        public long Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? CategoryName { get; set; }
        public decimal AvgRating { get; set; }
        public int ReviewCount { get; set; }
    }

    private class PlaceMediaRaw
    {
        public long PlaceId { get; set; }
        public string Url { get; set; } = string.Empty;
    }

    public async Task<IReadOnlyList<CollectionDto>> GetFeaturedCollectionsAsync(int count = 6, CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        const string sql = @"
            SELECT TOP (@Count) c.Id, c.Title, c.IsFeatured, c.DisplayOrder,
                   (SELECT COUNT(1) FROM dbo.CollectionPlaces cp WHERE cp.CollectionId = c.Id) AS PlaceCount
            FROM dbo.Collections c
            WHERE c.Status = 1 AND c.IsFeatured = 1
            ORDER BY c.DisplayOrder;

            SELECT cp.CollectionId, p.Id, p.Name, p.AvgRating, p.ReviewCount
            FROM dbo.CollectionPlaces cp
            INNER JOIN dbo.Places p ON cp.PlaceId = p.Id
            LEFT JOIN dbo.Categories cat ON p.CategoryId = cat.Id
            INNER JOIN dbo.Collections c ON cp.CollectionId = c.Id
            WHERE c.Status = 1 AND c.IsFeatured = 1 AND p.Status = 1
            ORDER BY cp.CollectionId, cp.DisplayOrder;

            SELECT pm.PlaceId, pm.Url
            FROM dbo.PlaceMedia pm
            INNER JOIN dbo.CollectionPlaces cp ON pm.PlaceId = cp.PlaceId
            INNER JOIN dbo.Collections c ON cp.CollectionId = c.Id
            WHERE c.Status = 1 AND c.IsFeatured = 1
            ORDER BY pm.PlaceId, pm.DisplayOrder;";

        using var multi = await connection.QueryMultipleAsync(sql, new { Count = count });
        var collections = (await multi.ReadAsync<CollectionDto>()).ToList();
        var places = (await multi.ReadAsync<PlaceInCollectionRaw>()).ToList();
        var medias = (await multi.ReadAsync<PlaceMediaRaw>()).ToList();

        var mediaByPlace = medias.ToLookup(m => m.PlaceId, m => m.Url);

        var placeCards = places.Select(p => new
        {
            p.CollectionId,
            Card = new PlaceCardDto
            {
                Id = p.Id,
                Name = p.Name,
                AvgRating = p.AvgRating,
                ReviewCount = p.ReviewCount,
                MediaUrls = mediaByPlace[p.Id].ToList()
            }
        }).ToLookup(p => p.CollectionId, p => p.Card);

        foreach (var col in collections)
        {
            col.Places = placeCards[col.Id].ToList();
        }

        return collections;
    }
}
