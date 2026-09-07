using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using Dapper;
using Domain.Enums;
using Infrastructure.Persistence;
using Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class PlaceRepository : IPlaceRepository
{
    private readonly TravelReviewDbContext _dbContext;

    public PlaceRepository(TravelReviewDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<PlaceFilterOptionsDto> GetFilterOptionsAsync(CancellationToken ct = default)
    {
        var categories = await _dbContext.Categories
            .AsNoTracking()
            .Where(c => c.Status == RecordStatus.Active)
            .OrderBy(c => c.Name)
            .Select(c => new LookupItemDto
            {
                Id = c.Id,
                Name = c.Name
            })
            .ToListAsync(ct);

        var regions = await _dbContext.Regions
            .AsNoTracking()
            .Where(r => r.Status == RecordStatus.Active)
            .OrderBy(r => r.OrderIndex)
            .Select(r => new RegionLookupDto
            {
                Id = r.Id,
                Name = r.Name,
                Provinces = r.Provinces
                    .Where(p => p.Status == RecordStatus.Active)
                    .OrderBy(p => p.DisplayOrder)
                    .ThenBy(p => p.Name)
                    .Select(p => new LookupItemDto
                    {
                        Id = p.Id,
                        Name = p.Name
                    })
                    .ToList()
            })
            .ToListAsync(ct);

        return new PlaceFilterOptionsDto
        {
            Categories = categories,
            Regions = regions
        };
    }

    public async Task<(IReadOnlyList<PlaceSummaryDto> Items, long TotalCount)> SearchAndFilterAsync(
        PlaceFilterParams p,
        CancellationToken ct = default) {
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
            SELECT COUNT(1)
            FROM dbo.Places p
            INNER JOIN dbo.Provinces prov ON p.ProvinceId = prov.Id
            INNER JOIN dbo.Categories cat ON p.CategoryId = cat.Id
            WHERE p.Status = 1
              AND (@Keyword IS NULL OR (
                  p.Name LIKE @Keyword OR 
                  p.Address LIKE @Keyword OR 
                  p.Description LIKE @Keyword OR 
                  prov.Name LIKE @Keyword OR 
                  cat.Name LIKE @Keyword
              ))
              AND (@RegionId IS NULL OR prov.RegionId = @RegionId)
              AND (@ProvinceId IS NULL OR p.ProvinceId = @ProvinceId)
              AND (@CategoryId IS NULL OR p.CategoryId = @CategoryId)
              AND (@PlaceTypeId IS NULL OR cat.PlaceTypeId = @PlaceTypeId)
              AND (@MinPrice IS NULL OR (p.MaxPrice >= @MinPrice OR p.MinPrice >= @MinPrice))
              AND (@MaxPrice IS NULL OR (p.MinPrice <= @MaxPrice OR p.MaxPrice <= @MaxPrice))
              AND (@MinRating IS NULL OR p.AvgRating >= @MinRating);

            SELECT p.Id, p.Name, p.Description, p.Address, p.ProvinceId, prov.Name AS ProvinceName,
                   prov.RegionId, r.Name AS RegionName, p.CategoryId, cat.Name AS CategoryName,
                   cat.PlaceTypeId, pt.Name AS PlaceTypeName, p.MinPrice, p.MaxPrice, p.OpeningHours,
                   p.AvgRating, p.ReviewCount, p.Status, p.CreatedAt,
                   (SELECT TOP 1 pm.Url FROM dbo.PlaceMedia pm WHERE pm.PlaceId = p.Id ORDER BY pm.DisplayOrder) AS ThumbnailUrl
            FROM dbo.Places p
            INNER JOIN dbo.Provinces prov ON p.ProvinceId = prov.Id
            INNER JOIN dbo.Regions r ON prov.RegionId = r.Id
            INNER JOIN dbo.Categories cat ON p.CategoryId = cat.Id
            INNER JOIN dbo.PlaceTypes pt ON cat.PlaceTypeId = pt.Id
            WHERE p.Status = 1
              AND (@Keyword IS NULL OR (
                  p.Name LIKE @Keyword OR 
                  p.Address LIKE @Keyword OR 
                  p.Description LIKE @Keyword OR 
                  prov.Name LIKE @Keyword OR 
                  cat.Name LIKE @Keyword
              ))
              AND (@RegionId IS NULL OR prov.RegionId = @RegionId)
              AND (@ProvinceId IS NULL OR p.ProvinceId = @ProvinceId)
              AND (@CategoryId IS NULL OR p.CategoryId = @CategoryId)
              AND (@PlaceTypeId IS NULL OR cat.PlaceTypeId = @PlaceTypeId)
              AND (@MinPrice IS NULL OR (p.MaxPrice >= @MinPrice OR p.MinPrice >= @MinPrice))
              AND (@MaxPrice IS NULL OR (p.MinPrice <= @MaxPrice OR p.MaxPrice <= @MaxPrice))
              AND (@MinRating IS NULL OR p.AvgRating >= @MinRating)
            ORDER BY
                CASE WHEN @SortBy = 'rating_desc' THEN p.AvgRating END DESC,
                CASE WHEN @SortBy = 'price_asc' THEN p.MinPrice END ASC,
                CASE WHEN @SortBy = 'price_desc' THEN p.MaxPrice END DESC,
                CASE WHEN @SortBy = 'reviews_desc' THEN p.ReviewCount END DESC,
                CASE WHEN @SortBy = 'popular_desc' THEN (p.ReviewCount * 10 + CAST(p.AvgRating * 20 AS INT)) END DESC,
                p.CreatedAt DESC
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;";

        using var multi = await connection.QueryMultipleAsync(sql, parameters);
        var totalCount = await multi.ReadFirstAsync<long>();
        var items = (await multi.ReadAsync<PlaceSummaryDto>()).ToList();

        return (items, totalCount);
    }

    public async Task<PlaceDetailDto?> GetPlaceDetailAsync(long id, CancellationToken ct = default) {
        var connection = _dbContext.Database.GetDbConnection();

        const string sql = @"
            SELECT p.Id, p.Name, p.Description, p.Address, p.ProvinceId, prov.Name AS ProvinceName,
                   prov.RegionId, r.Name AS RegionName, p.CategoryId, cat.Name AS CategoryName,
                   cat.PlaceTypeId, pt.Name AS PlaceTypeName, p.MinPrice, p.MaxPrice, p.OpeningHours,
                   p.AvgRating, p.ReviewCount, p.Latitude, p.Longitude, p.Phone AS PhoneNumber,
                   p.Website, p.Status, p.CreatedAt, p.CoverImageUrl AS ThumbnailUrl
            FROM dbo.Places p
            INNER JOIN dbo.Provinces prov ON p.ProvinceId = prov.Id
            INNER JOIN dbo.Regions r ON prov.RegionId = r.Id
            INNER JOIN dbo.Categories cat ON p.CategoryId = cat.Id
            INNER JOIN dbo.PlaceTypes pt ON cat.PlaceTypeId = pt.Id
            WHERE p.Id = @Id AND p.Status = 1;

            SELECT pm.Url
            FROM dbo.PlaceMedia pm
            WHERE pm.PlaceId = @Id
            ORDER BY pm.DisplayOrder;";

        using var multi = await connection.QueryMultipleAsync(sql, new { Id = id });
        var place = await multi.ReadFirstOrDefaultAsync<PlaceDetailDto>();
        if (place == null) return null;

        var mediaUrls = (await multi.ReadAsync<string>()).ToList();
        place.MediaUrls = mediaUrls;
        if (string.IsNullOrWhiteSpace(place.ThumbnailUrl) && mediaUrls.Count > 0)
        {
            place.ThumbnailUrl = mediaUrls[0];
        }

        place.DetailedDescription = place.Description ?? string.Empty;
        place.Highlights =
        [
            $"Điểm đến nổi tiếng tại {place.ProvinceName}",
            $"Thuộc danh mục {place.CategoryName} hấp dẫn",
            $"Được đánh giá {place.AvgRating:F1} sao từ {place.ReviewCount} lượt du khách"
        ];

        place.Amenities =
        [
            new PlaceAmenityDto { Id = "1", Name = "Wifi miễn phí", Icon = "wifi" },
            new PlaceAmenityDto { Id = "2", Name = "Bãi đỗ xe thuận tiện", Icon = "car" },
            new PlaceAmenityDto { Id = "3", Name = "Hỗ trợ thanh toán thẻ / QR", Icon = "credit-card" },
            new PlaceAmenityDto { Id = "4", Name = "Không gian thoáng mát", Icon = "wind" },
            new PlaceAmenityDto { Id = "5", Name = "Phù hợp gia đình & nhóm bạn", Icon = "users" }
        ];

        return place;
    }

    public async Task<IReadOnlyList<PlaceMapItemDto>> GetPlacesMapAsync(
        string? keyword,
        string? region,
        int? provinceId,
        int? categoryId,
        double? minLng,
        double? minLat,
        double? maxLng,
        double? maxLat,
        CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();
        string? regionKey = null;
        if (!string.IsNullOrWhiteSpace(region) && !string.Equals(region, "all", StringComparison.OrdinalIgnoreCase))
        {
            regionKey = region.Trim().ToLowerInvariant();
        }
        var parameters = new
        {
            Keyword = !string.IsNullOrWhiteSpace(keyword) ? $"%{keyword.Trim()}%" : null,
            RegionKey = regionKey,
            ProvinceId = provinceId > 0 ? provinceId : null,
            CategoryId = categoryId > 0 ? categoryId : null,
            MinLng = minLng,
            MinLat = minLat,
            MaxLng = maxLng,
            MaxLat = maxLat
        };
        const string sql = @"
            SELECT TOP 500
                p.Id,
                p.Name,
                cat.Name AS Category,
                p.CategoryId,
                CASE 
                    WHEN r.Id = 1 THEN 'north'
                    WHEN r.Id = 2 THEN 'central'
                    WHEN r.Id = 3 THEN 'south'
                    ELSE 'north'
                END AS Region,
                r.Name AS RegionName,
                prov.Name AS Province,
                p.Address,
                p.AvgRating,
                p.ReviewCount,
                CASE 
                    WHEN p.MinPrice IS NOT NULL AND p.MaxPrice IS NOT NULL THEN 
                        CONCAT(FORMAT(p.MinPrice, '#,##0', 'vi-VN'), N'đ - ', FORMAT(p.MaxPrice, '#,##0', 'vi-VN'), N'đ')
                    WHEN p.MinPrice IS NOT NULL THEN 
                        CONCAT(N'Từ ', FORMAT(p.MinPrice, '#,##0', 'vi-VN'), N'đ')
                    ELSE N'Miễn phí'
                END AS Price,
                COALESCE(p.CoverImageUrl, (SELECT TOP 1 pm.Url FROM dbo.PlaceMedia pm WHERE pm.PlaceId = p.Id ORDER BY pm.DisplayOrder)) AS ImageUrl,
                p.Longitude,
                p.Latitude
            FROM dbo.Places p
            INNER JOIN dbo.Provinces prov ON p.ProvinceId = prov.Id
            INNER JOIN dbo.Regions r ON prov.RegionId = r.Id
            INNER JOIN dbo.Categories cat ON p.CategoryId = cat.Id
            WHERE p.Status = 1
              AND p.Latitude IS NOT NULL 
              AND p.Longitude IS NOT NULL
              AND (@Keyword IS NULL OR (p.Name LIKE @Keyword OR p.Address LIKE @Keyword OR prov.Name LIKE @Keyword))
              AND (@ProvinceId IS NULL OR p.ProvinceId = @ProvinceId)
              AND (@CategoryId IS NULL OR p.CategoryId = @CategoryId)
              AND (@RegionKey IS NULL OR (
                    (@RegionKey = 'north' AND r.Id = 1) OR
                    (@RegionKey = 'central' AND r.Id = 2) OR
                    (@RegionKey = 'south' AND r.Id = 3)
                  ))
              AND (@MinLng IS NULL OR (p.Longitude BETWEEN @MinLng AND @MaxLng AND p.Latitude BETWEEN @MinLat AND @MaxLat))
            ORDER BY p.AvgRating DESC, p.ReviewCount DESC;";

        var rows = (await connection.QueryAsync<RawPlaceMapRow>(sql, parameters)).ToList();
        var result = new List<PlaceMapItemDto>();

        foreach (var r in rows)
        {
            double lng = r.Longitude.HasValue ? Convert.ToDouble(r.Longitude.Value) : 0.0;
            double lat = r.Latitude.HasValue ? Convert.ToDouble(r.Latitude.Value) : 0.0;

            result.Add(new PlaceMapItemDto
            {
                Id = r.Id,
                Name = r.Name,
                Category = r.Category,
                CategoryId = r.CategoryId,
                Region = r.Region,
                RegionName = r.RegionName,
                Province = r.Province,
                Address = r.Address,
                AvgRating = r.AvgRating,
                ReviewCount = r.ReviewCount,
                Price = r.Price,
                ImageUrl = r.ImageUrl,
                Coordinates = [lng, lat]
            });
        }

        return result;
    }

    public async Task<PlaceReviewSummaryDto> GetPlaceReviewsAsync(
        long placeId,
        int page,
        int pageSize,
        int? rating,
        CancellationToken ct = default){
        var connection = _dbContext.Database.GetDbConnection();

        var safePage = page < 1 ? 1 : page;
        var safePageSize = pageSize is < 1 or > 50 ? 10 : pageSize;
        var offset = (safePage - 1) * safePageSize;

        const string sql = @"
            -- 1. Tổng điểm và số lượng review
            SELECT 
                COALESCE(p.AvgRating, 0.0) AS AvgRating,
                COALESCE(p.ReviewCount, 0) AS TotalReviews
            FROM dbo.Places p
            WHERE p.Id = @PlaceId;

            -- 2. Thống kê theo sao (1 đến 5)
            SELECT Rating, COUNT(1) AS TotalCount
            FROM dbo.Reviews
            WHERE PlaceId = @PlaceId AND Status = 1
            GROUP BY Rating;

            -- 3. Danh sách review phân trang
            SELECT 
                r.Id,
                CAST(r.UserId AS VARCHAR(50)) AS UserId,
                COALESCE(up.FullName, N'Người dùng LangThang') AS UserName,
                up.AvatarUrl AS UserAvatar,
                r.Rating,
                r.Content,
                r.CreatedAt,
                0 AS LikesCount
            FROM dbo.Reviews r
            LEFT JOIN dbo.UserProfiles up ON r.UserId = up.UserId
            WHERE r.PlaceId = @PlaceId AND r.Status = 1
              AND (@Rating IS NULL OR r.Rating = @Rating)
            ORDER BY r.CreatedAt DESC
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;";

        using var multi = await connection.QueryMultipleAsync(sql, new
        {
            PlaceId = placeId,
            Rating = (rating is >= 1 and <= 5) ? rating : null,
            Offset = offset,
            PageSize = safePageSize
        });

        var summaryHeader = await multi.ReadFirstOrDefaultAsync();
        var ratingCounts = (await multi.ReadAsync<(byte Rating, int TotalCount)>()).ToList();
        var reviewItems = (await multi.ReadAsync<ReviewItemDto>()).ToList();

        var summary = new PlaceReviewSummaryDto
        {
            AvgRating = summaryHeader != null ? Convert.ToDecimal(summaryHeader.AvgRating) : 0m,
            TotalReviews = summaryHeader != null ? Convert.ToInt32(summaryHeader.TotalReviews) : 0
        };

        foreach (var rc in ratingCounts)
        {
            if (rc.Rating >= 1 && rc.Rating <= 5)
            {
                summary.RatingBreakdown[rc.Rating.ToString()] = rc.TotalCount;
            }
        }

        if (reviewItems.Count > 0)
        {
            var reviewIds = reviewItems.Select(r => r.Id).ToList();
            const string mediaSql = @"
                SELECT rm.ReviewId, rm.Url
                FROM dbo.ReviewMedia rm
                WHERE rm.ReviewId IN @ReviewIds;";

            var medias = (await connection.QueryAsync<(long ReviewId, string Url)>(mediaSql, new { ReviewIds = reviewIds })).ToList();
            var mediaLookup = medias.ToLookup(m => m.ReviewId, m => m.Url);

            foreach (var item in reviewItems)
            {
                item.Images = mediaLookup[item.Id].ToList();
            }
        }

        summary.Items = reviewItems;
        return summary;
    }

    public async Task<bool> IsPlaceSavedAsync(long userId, long placeId, CancellationToken ct = default)
    {
        return await _dbContext.Favorites
            .AsNoTracking()
            .AnyAsync(f => f.UserId == userId && f.TargetId == placeId && f.TargetType == FavoriteTargetType.Place, ct);
    }
}
