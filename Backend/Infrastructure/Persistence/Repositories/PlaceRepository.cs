using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using Dapper;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class PlaceRepository : IPlaceRepository
{
    private readonly TravelReviewDbContext _dbContext;

    public PlaceRepository(TravelReviewDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    private class ProvinceLookupRaw
    {
        public int Id { get; set; }
        public int RegionId { get; set; }
        public string Name { get; set; } = string.Empty;
    }

    public async Task<PlaceFilterOptionsDto> GetFilterOptionsAsync(CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        const string sql = @"
            SELECT c.Id, c.Name 
            FROM dbo.Categories c 
            WHERE c.Status = 1 
            ORDER BY c.Name;

            SELECT r.Id, r.Name 
            FROM dbo.Regions r 
            WHERE r.Status = 1 
            ORDER BY r.OrderIndex;

            SELECT p.Id, p.RegionId, p.Name 
            FROM dbo.Provinces p 
            WHERE p.Status = 1 
            ORDER BY p.DisplayOrder, p.Name;";

        using var multi = await connection.QueryMultipleAsync(sql);
        var categories = (await multi.ReadAsync<LookupItemDto>()).ToList();
        var regions = (await multi.ReadAsync<LookupItemDto>()).ToList();
        var provinces = (await multi.ReadAsync<ProvinceLookupRaw>()).ToList();

        var provincesByRegion = provinces.ToLookup(p => p.RegionId);

        var regionLookups = regions.Select(r => new RegionLookupDto
        {
            Id = r.Id,
            Name = r.Name,
            Provinces = provincesByRegion[r.Id].Select(p => new LookupItemDto
            {
                Id = p.Id,
                Name = p.Name
            }).ToList()
        }).ToList();

        return new PlaceFilterOptionsDto
        {
            Categories = categories,
            Regions = regionLookups
        };
    }

    public async Task<(IReadOnlyList<PlaceSummaryDto> Items, long TotalCount)> SearchAndFilterAsync(
        PlaceFilterParams p,
        CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        var safePageIndex = p.Page < 1 ? 1 : p.Page;
        var safePageSize = p.PageSize is < 1 or > 50 ? 12 : p.PageSize;
        var offset = (safePageIndex - 1) * safePageSize;

        string? keywordPattern = !string.IsNullOrWhiteSpace(p.Keyword) ? $"%{p.Keyword.Trim()}%" : null;

        var parameters = new
        {
            Keyword = keywordPattern,
            RegionId = p.RegionId > 0 ? p.RegionId : null,
            ProvinceId = p.ProvinceId > 0 ? p.ProvinceId : null,
            CategoryId = p.CategoryId > 0 ? p.CategoryId : null,
            PlaceTypeId = p.PlaceTypeId > 0 ? p.PlaceTypeId : null,
            MinPrice = p.MinPrice > 0 ? p.MinPrice : null,
            MaxPrice = p.MaxPrice > 0 ? p.MaxPrice : null,
            MinRating = p.MinRating > 0 ? p.MinRating : null,
            SortBy = p.SortBy?.ToLowerInvariant(),
            Offset = offset,
            PageSize = safePageSize
        };

        const string sql = @"
            SELECT p.Id, p.Name, p.Description, p.Address, p.ProvinceId, prov.Name AS ProvinceName,
                   prov.RegionId, r.Name AS RegionName, p.CategoryId, cat.Name AS CategoryName,
                   cat.PlaceTypeId, pt.Name AS PlaceTypeName, p.MinPrice, p.MaxPrice, p.OpeningHours,
                   p.AvgRating, p.ReviewCount, p.Status, p.CreatedAt
            INTO #FilteredPlaces
            FROM dbo.Places p
            INNER JOIN dbo.Provinces prov ON p.ProvinceId = prov.Id
            INNER JOIN dbo.Regions r ON prov.RegionId = r.Id
            INNER JOIN dbo.Categories cat ON p.CategoryId = cat.Id
            INNER JOIN dbo.PlaceTypes pt ON cat.PlaceTypeId = pt.Id
            WHERE p.Status = 2
              AND (@Keyword IS NULL OR (p.Name LIKE @Keyword OR p.Address LIKE @Keyword OR prov.Name LIKE @Keyword OR cat.Name LIKE @Keyword))
              AND (@RegionId IS NULL OR prov.RegionId = @RegionId)
              AND (@ProvinceId IS NULL OR p.ProvinceId = @ProvinceId)
              AND (@CategoryId IS NULL OR p.CategoryId = @CategoryId)
              AND (@PlaceTypeId IS NULL OR cat.PlaceTypeId = @PlaceTypeId)
              AND (@MinPrice IS NULL OR (p.MaxPrice >= @MinPrice OR p.MinPrice >= @MinPrice))
              AND (@MaxPrice IS NULL OR (p.MinPrice <= @MaxPrice OR p.MaxPrice <= @MaxPrice))
              AND (@MinRating IS NULL OR p.AvgRating >= @MinRating);

            SELECT COUNT(1) FROM #FilteredPlaces;

            SELECT pp.*, thumb.ThumbnailUrl
            FROM (
                SELECT *
                FROM #FilteredPlaces
                ORDER BY
                    CASE WHEN @SortBy = 'rating_desc' THEN AvgRating END DESC,
                    CASE WHEN @SortBy = 'price_asc' THEN MinPrice END ASC,
                    CASE WHEN @SortBy = 'price_desc' THEN MaxPrice END DESC,
                    CASE WHEN @SortBy = 'reviews_desc' THEN ReviewCount END DESC,
                    CASE WHEN @SortBy = 'popular_desc' THEN (ReviewCount * 10 + CAST(AvgRating * 20 AS INT)) END DESC,
                    CreatedAt DESC
                OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY
            ) pp
            OUTER APPLY (
                SELECT TOP 1 pm.Url AS ThumbnailUrl
                FROM dbo.PlaceMedia pm
                WHERE pm.PlaceId = pp.Id AND pm.IsVerified = 1
                ORDER BY pm.DisplayOrder
            ) thumb;

            DROP TABLE #FilteredPlaces;";

        using var multi = await connection.QueryMultipleAsync(sql, parameters);
        var totalCount = await multi.ReadFirstAsync<long>();
        var items = (await multi.ReadAsync<PlaceSummaryDto>()).ToList();

        return (items, totalCount);
    }
}
