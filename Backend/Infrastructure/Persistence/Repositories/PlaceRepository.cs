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
        CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        var safePageIndex = p.Page < 1 ? 1 : p.Page;
        var safePageSize = p.PageSize is < 1 or > 50 ? 12 : p.PageSize;
        var offset = (safePageIndex - 1) * safePageSize;

        var parameters = new DynamicParameters();
        var whereClauses = new List<string> { "p.Status = 1" };

        if (!string.IsNullOrWhiteSpace(p.Keyword))
        {
            whereClauses.Add(@"(
                p.Name LIKE @Keyword OR 
                p.Address LIKE @Keyword OR 
                p.Description LIKE @Keyword OR 
                prov.Name LIKE @Keyword OR 
                cat.Name LIKE @Keyword
            )");
            parameters.Add("Keyword", $"%{p.Keyword.Trim()}%");
        }

        // Ưu tiên Region hơn Province:
        // Nếu có Region thì ưu tiên lấy tất cả các Province thuộc các Region đó.
        var regionIds = p.GetEffectiveRegionIds();
        var provinceIds = p.GetEffectiveProvinceIds();

        if (regionIds.Count > 0)
        {
            whereClauses.Add("prov.RegionId IN @RegionIds");
            parameters.Add("RegionIds", regionIds);
        }
        else if (provinceIds.Count > 0)
        {
            whereClauses.Add("p.ProvinceId IN @ProvinceIds");
            parameters.Add("ProvinceIds", provinceIds);
        }

        // Lọc danh mục (hỗ trợ nhiều CategoryId)
        var categoryIds = p.GetEffectiveCategoryIds();
        if (categoryIds.Count > 0)
        {
            whereClauses.Add("p.CategoryId IN @CategoryIds");
            parameters.Add("CategoryIds", categoryIds);
        }

        // Lọc loại hình địa điểm (hỗ trợ nhiều PlaceTypeId)
        var placeTypeIds = p.GetEffectivePlaceTypeIds();
        if (placeTypeIds.Count > 0)
        {
            whereClauses.Add("cat.PlaceTypeId IN @PlaceTypeIds");
            parameters.Add("PlaceTypeIds", placeTypeIds);
        }

        // Lọc khoảng giá
        if (p.MinPrice.HasValue && p.MinPrice.Value > 0)
        {
            whereClauses.Add("(p.MaxPrice >= @MinPrice OR p.MinPrice >= @MinPrice)");
            parameters.Add("MinPrice", p.MinPrice.Value);
        }

        if (p.MaxPrice.HasValue && p.MaxPrice.Value > 0)
        {
            whereClauses.Add("(p.MinPrice <= @MaxPrice OR p.MaxPrice <= @MaxPrice)");
            parameters.Add("MaxPrice", p.MaxPrice.Value);
        }

        // Lọc điểm đánh giá
        if (p.MinRating.HasValue && p.MinRating.Value > 0)
        {
            whereClauses.Add("p.AvgRating >= @MinRating");
            parameters.Add("MinRating", p.MinRating.Value);
        }

        var whereSql = "WHERE " + string.Join(" AND ", whereClauses);

        var countSql = $@"
            SELECT COUNT(1)
            FROM dbo.Places p
            INNER JOIN dbo.Provinces prov ON p.ProvinceId = prov.Id
            INNER JOIN dbo.Categories cat ON p.CategoryId = cat.Id
            {whereSql};";

        var totalCount = await connection.ExecuteScalarAsync<long>(countSql, parameters);
        if (totalCount == 0)
        {
            return (Array.Empty<PlaceSummaryDto>(), 0);
        }

        parameters.Add("Offset", offset);
        parameters.Add("PageSize", safePageSize);
        parameters.Add("SortBy", p.SortBy?.ToLowerInvariant());

        var dataSql = $@"
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
            {whereSql}
            ORDER BY
                CASE WHEN @SortBy = 'rating_desc' THEN p.AvgRating END DESC,
                CASE WHEN @SortBy = 'price_asc' THEN p.MinPrice END ASC,
                CASE WHEN @SortBy = 'price_desc' THEN p.MaxPrice END DESC,
                CASE WHEN @SortBy = 'reviews_desc' THEN p.ReviewCount END DESC,
                CASE WHEN @SortBy = 'popular_desc' THEN (p.ReviewCount * 10 + CAST(p.AvgRating * 20 AS INT)) END DESC,
                p.CreatedAt DESC
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;";

        var items = (await connection.QueryAsync<PlaceSummaryDto>(dataSql, parameters)).ToList();

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
            ORDER BY pm.DisplayOrder;

            SELECT rm.Url
            FROM dbo.ReviewMedia rm
            INNER JOIN dbo.Reviews r ON rm.ReviewId = r.Id
            WHERE r.PlaceId = @Id AND r.Status = 1 AND rm.MediaType = 1
            ORDER BY r.CreatedAt DESC, rm.Id ASC;";

        using var multi = await connection.QueryMultipleAsync(sql, new { Id = id });
        var place = await multi.ReadFirstOrDefaultAsync<PlaceDetailDto>();
        if (place == null) return null;

        var placeMediaUrls = (await multi.ReadAsync<string>()).ToList();
        var reviewMediaUrls = (await multi.ReadAsync<string>()).ToList();

        var allMediaUrls = placeMediaUrls
            .Concat(reviewMediaUrls)
            .Where(url => !string.IsNullOrWhiteSpace(url))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        place.MediaUrls = allMediaUrls;
        if (string.IsNullOrWhiteSpace(place.ThumbnailUrl) && allMediaUrls.Count > 0)
        {
            place.ThumbnailUrl = allMediaUrls[0];
        }

        place.DetailedDescription = place.Description ?? string.Empty;
        place.Highlights =
        [
            $"Điểm đến nổi tiếng tại {place.ProvinceName}",
            $"Thuộc danh mục {place.CategoryName} hấp dẫn",
            $"Được đánh giá {place.AvgRating:F1} sao từ {place.ReviewCount} lượt du khách"
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
        CancellationToken ct = default){
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
        long? userId = null,
        CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        var safePage = page < 1 ? 1 : page;
        var safePageSize = pageSize is < 1 or > 50 ? 10 : pageSize;
        var offset = (safePage - 1) * safePageSize;

        const string sql = @"
            SELECT 
                COALESCE(p.AvgRating, 0.0) AS AvgRating,
                COALESCE(p.ReviewCount, 0) AS TotalReviews
            FROM dbo.Places p
            WHERE p.Id = @PlaceId;

            SELECT Rating, COUNT(1) AS TotalCount
            FROM dbo.Reviews
            WHERE PlaceId = @PlaceId AND Status = 1
            GROUP BY Rating;

            SELECT 
                r.Id,
                CAST(r.UserId AS VARCHAR(50)) AS UserId,
                COALESCE(up.FullName, N'Người dùng LangThang') AS UserName,
                up.AvatarUrl AS UserAvatar,
                r.Rating,
                r.Content,
                r.CreatedAt,
                r.LikesCount,
                (SELECT COUNT(1) FROM dbo.Comments c WHERE c.ReviewId = r.Id AND c.Status = 1) AS CommentsCount
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
                SELECT rm.ReviewId, rm.MediaType, rm.Url
                FROM dbo.ReviewMedia rm
                WHERE rm.ReviewId IN @ReviewIds;";

            var medias = (await connection.QueryAsync<(long ReviewId, byte MediaType, string Url)>(mediaSql, new { ReviewIds = reviewIds })).ToList();
            var imagesLookup = medias.Where(m => m.MediaType == (byte)FoodMediaType.Image).ToLookup(m => m.ReviewId, m => m.Url);
            var videosLookup = medias.Where(m => m.MediaType == (byte)FoodMediaType.Video).ToLookup(m => m.ReviewId, m => m.Url);

            var userLikedSet = new HashSet<long>();
            if (userId.HasValue && userId.Value > 0)
            {
                const string likeSql = @"
                    SELECT ReviewId 
                    FROM dbo.ReviewLikes 
                    WHERE UserId = @UserId AND ReviewId IN @ReviewIds;";
                var likedIds = await connection.QueryAsync<long>(likeSql, new { UserId = userId.Value, ReviewIds = reviewIds });
                userLikedSet = new HashSet<long>(likedIds);
            }

            foreach (var item in reviewItems)
            {
                item.Images = imagesLookup[item.Id].ToList();
                item.Videos = videosLookup[item.Id].ToList();
                item.IsLiked = userLikedSet.Contains(item.Id);
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
