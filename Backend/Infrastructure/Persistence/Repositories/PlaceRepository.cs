using System.Globalization;
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
            .Where(c => c.Status == RecordStatus.Active && c.PlaceType.Status == RecordStatus.Active)
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
                (cat.Status = 1 AND cat.Name LIKE @Keyword)
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
            whereClauses.Add("(p.CategoryId IN @CategoryIds AND cat.Status = 1)");
            parameters.Add("CategoryIds", categoryIds);
        }

        // Lọc loại hình địa điểm (hỗ trợ nhiều PlaceTypeId)
        var placeTypeIds = p.GetEffectivePlaceTypeIds();
        if (placeTypeIds.Count > 0)
        {
            whereClauses.Add("(cat.PlaceTypeId IN @PlaceTypeIds AND pt.Status = 1)");
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
            INNER JOIN dbo.PlaceTypes pt ON cat.PlaceTypeId = pt.Id
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
                   prov.RegionId, r.Name AS RegionName, p.CategoryId, 
                   CASE WHEN cat.Status = 1 THEN cat.Name ELSE N'Không khả dụng' END AS CategoryName,
                   cat.PlaceTypeId, 
                   CASE WHEN pt.Status = 1 THEN pt.Name ELSE N'Không khả dụng' END AS PlaceTypeName, 
                   p.MinPrice, p.MaxPrice, p.OpeningHours,
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

    public async Task<PlaceDetailDto?> GetPlaceDetailAsync(long id, long? userId = null, CancellationToken ct = default) {
        var connection = _dbContext.Database.GetDbConnection();

        const string sql = @"
            SELECT p.Id, p.Name, p.Description, p.Address, p.ProvinceId, prov.Name AS ProvinceName,
                   prov.RegionId, r.Name AS RegionName, p.CategoryId, 
                   CASE WHEN cat.Status = 1 THEN cat.Name ELSE N'Không khả dụng' END AS CategoryName,
                   cat.PlaceTypeId, 
                   CASE WHEN pt.Status = 1 THEN pt.Name ELSE N'Không khả dụng' END AS PlaceTypeName, 
                   p.MinPrice, p.MaxPrice, p.OpeningHours,
                   p.AvgRating, p.ReviewCount, p.ViewCount, p.Latitude, p.Longitude, p.Phone AS PhoneNumber,
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
            ORDER BY r.CreatedAt DESC, rm.Id ASC;

            SELECT f.Id, f.Name, f.Description, f.MinPrice, f.MaxPrice, f.CoverImageUrl AS ImageUrl
            FROM dbo.FoodPlaces fp
            INNER JOIN dbo.Foods f ON fp.FoodId = f.Id
            WHERE fp.PlaceId = @Id AND f.Status = 1
            ORDER BY f.Name ASC;

            SELECT fm.FoodId, fm.Url
            FROM dbo.FoodMedia fm
            INNER JOIN dbo.FoodPlaces fp ON fm.FoodId = fp.FoodId
            WHERE fp.PlaceId = @Id
            ORDER BY fm.DisplayOrder, fm.Id ASC;";

        using var multi = await connection.QueryMultipleAsync(sql, new { Id = id });
        var place = await multi.ReadFirstOrDefaultAsync<PlaceDetailDto>();
        if (place == null) return null;

        _ = connection.ExecuteAsync("UPDATE dbo.Places SET ViewCount = ViewCount + 1 WHERE Id = @Id;", new { Id = id });
        place.ViewCount += 1;

        if (userId.HasValue && userId.Value > 0)
        {
            _ = connection.ExecuteAsync(@"
                IF EXISTS (SELECT 1 FROM dbo.AccessHistories WHERE UserId = @UserId AND PlaceId = @PlaceId)
                    UPDATE dbo.AccessHistories SET ViewedAt = SYSUTCDATETIME() WHERE UserId = @UserId AND PlaceId = @PlaceId;
                ELSE
                    INSERT INTO dbo.AccessHistories (UserId, PlaceId, ViewedAt) VALUES (@UserId, @PlaceId, SYSUTCDATETIME());",
                new { UserId = userId.Value, PlaceId = id });
        }

        var placeMediaUrls = (await multi.ReadAsync<string>()).ToList();
        var reviewMediaUrls = (await multi.ReadAsync<string>()).ToList();
        var foodRows = (await multi.ReadAsync<RawPlaceFoodRow>()).ToList();
        var foodMediaRows = (await multi.ReadAsync<RawFoodMediaRow>()).ToList();

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

        var foodMediaLookup = foodMediaRows
            .Where(fm => !string.IsNullOrWhiteSpace(fm.Url))
            .ToLookup(fm => fm.FoodId, fm => fm.Url);

        var viCulture = CultureInfo.GetCultureInfo("vi-VN");
        var foodsList = new List<PlaceFoodDto>();

        foreach (var f in foodRows)
        {
            var mediaUrls = foodMediaLookup[f.Id].ToList();
            if (!string.IsNullOrWhiteSpace(f.ImageUrl) && !mediaUrls.Contains(f.ImageUrl))
            {
                mediaUrls.Insert(0, f.ImageUrl);
            }

            string? priceRange = null;
            if (f.MinPrice.HasValue && f.MaxPrice.HasValue)
            {
                priceRange = $"{f.MinPrice.Value.ToString("N0", viCulture)}đ - {f.MaxPrice.Value.ToString("N0", viCulture)}đ";
            }
            else if (f.MinPrice.HasValue)
            {
                priceRange = $"Từ {f.MinPrice.Value.ToString("N0", viCulture)}đ";
            }
            else if (f.MaxPrice.HasValue)
            {
                priceRange = $"Đến {f.MaxPrice.Value.ToString("N0", viCulture)}đ";
            }

            foodsList.Add(new PlaceFoodDto
            {
                Id = f.Id,
                Name = f.Name,
                Description = f.Description,
                MinPrice = f.MinPrice,
                MaxPrice = f.MaxPrice,
                PriceRange = priceRange,
                ImageUrl = f.ImageUrl ?? (mediaUrls.Count > 0 ? mediaUrls[0] : null),
                MediaUrls = mediaUrls
            });
        }

        place.Foods = foodsList;

        place.DetailedDescription = place.Description ?? string.Empty;
        place.Highlights =
        [
            $"Điểm đến nổi tiếng tại {place.ProvinceName}",
            place.CategoryName == "Không khả dụng" ? "Điểm đến thú vị hấp dẫn" : $"Thuộc danh mục {place.CategoryName} hấp dẫn",
            $"Được đánh giá {place.AvgRating:F1} sao từ {place.ReviewCount} lượt du khách"
        ];

        if (userId.HasValue && userId.Value > 0)
        {
            place.IsSaved = await IsPlaceSavedAsync(userId.Value, id, ct);
            place.IsVisited = await IsPlaceVisitedAsync(userId.Value, id, ct);
        }

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
                CASE WHEN cat.Status = 1 THEN cat.Name ELSE N'Không khả dụng' END AS Category,
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
              AND (@Keyword IS NULL OR (p.Name LIKE @Keyword OR p.Address LIKE @Keyword OR prov.Name LIKE @Keyword OR (cat.Status = 1 AND cat.Name LIKE @Keyword)))
              AND (@ProvinceId IS NULL OR p.ProvinceId = @ProvinceId)
              AND (@CategoryId IS NULL OR (p.CategoryId = @CategoryId AND cat.Status = 1))
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
        bool includeHidden = false,
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
            WHERE PlaceId = @PlaceId AND (@IncludeHidden = 1 OR Status = 1)
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
                CASE WHEN r.Status = 1 THEN 'active' ELSE 'hidden' END AS Status,
                (SELECT COUNT(1) FROM dbo.Comments c WHERE c.ReviewId = r.Id AND (@IncludeHidden = 1 OR c.Status = 1)) AS CommentsCount
            FROM dbo.Reviews r
            LEFT JOIN dbo.UserProfiles up ON r.UserId = up.UserId
            WHERE r.PlaceId = @PlaceId AND (@IncludeHidden = 1 OR r.Status = 1)
              AND (@Rating IS NULL OR r.Rating = @Rating)
            ORDER BY r.CreatedAt DESC
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;";

        using var multi = await connection.QueryMultipleAsync(sql, new
        {
            PlaceId = placeId,
            Rating = (rating is >= 1 and <= 5) ? rating : null,
            IncludeHidden = includeHidden ? 1 : 0,
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

    public async Task<bool> IsPlaceVisitedAsync(long userId, long placeId, CancellationToken ct = default)
    {
        return await _dbContext.VisitLogs
            .AsNoTracking()
            .AnyAsync(v => v.UserId == userId && v.PlaceId == placeId, ct);
    }

    public async Task<IReadOnlyList<PlaceSummaryDto>> GetRelatedPlacesAsync(
        long placeId,
        int limit = 6,
        CancellationToken ct = default)
    {
        var safeLimit = Math.Clamp(limit, 1, 20);
        var connection = _dbContext.Database.GetDbConnection();

        // 1. Lấy thông tin địa điểm gốc
        const string currentSql = @"
            SELECT p.Id, p.CategoryId, cat.PlaceTypeId, p.ProvinceId, prov.RegionId, p.Latitude, p.Longitude
            FROM dbo.Places p
            INNER JOIN dbo.Categories cat ON p.CategoryId = cat.Id
            INNER JOIN dbo.Provinces prov ON p.ProvinceId = prov.Id
            WHERE p.Id = @PlaceId AND p.Status = 1;";

        var current = await connection.QueryFirstOrDefaultAsync<CurrentPlaceContext>(currentSql, new { PlaceId = placeId });
        if (current == null)
        {
            return Array.Empty<PlaceSummaryDto>();
        }

        // 2. Chấm điểm Scored Waterfall các địa điểm ứng viên
        const string querySql = @"
            SELECT TOP (@Limit)
                p.Id, p.Name, p.Description, p.Address, p.ProvinceId, prov.Name AS ProvinceName,
                prov.RegionId, r.Name AS RegionName, p.CategoryId, 
                CASE WHEN cat.Status = 1 THEN cat.Name ELSE N'Không khả dụng' END AS CategoryName,
                cat.PlaceTypeId, 
                CASE WHEN pt.Status = 1 THEN pt.Name ELSE N'Không khả dụng' END AS PlaceTypeName, 
                p.MinPrice, p.MaxPrice, p.OpeningHours,
                p.AvgRating, p.ReviewCount, p.Status, p.CreatedAt,
                COALESCE(NULLIF(p.CoverImageUrl, ''), (SELECT TOP 1 pm.Url FROM dbo.PlaceMedia pm WHERE pm.PlaceId = p.Id ORDER BY pm.DisplayOrder)) AS ThumbnailUrl
            FROM dbo.Places p
            INNER JOIN dbo.Provinces prov ON p.ProvinceId = prov.Id
            INNER JOIN dbo.Regions r ON prov.RegionId = r.Id
            INNER JOIN dbo.Categories cat ON p.CategoryId = cat.Id
            INNER JOIN dbo.PlaceTypes pt ON cat.PlaceTypeId = pt.Id
            WHERE p.Id <> @PlaceId AND p.Status = 1 AND cat.Status = 1 AND pt.Status = 1
            ORDER BY
                (
                    -- A. Mức độ khớp Danh mục & Loại hình
                    CASE 
                        WHEN p.CategoryId = @CategoryId THEN 50.0
                        WHEN cat.PlaceTypeId = @PlaceTypeId THEN 25.0
                        ELSE 0.0 
                    END
                    -- B. Mức độ khớp Địa lý Hành chính (Tỉnh / Vùng)
                    + CASE 
                        WHEN p.ProvinceId = @ProvinceId THEN 30.0
                        WHEN prov.RegionId = @RegionId THEN 10.0
                        ELSE 0.0 
                    END
                    -- C. Điểm thưởng khoảng cách lân cận GPS (nếu cả 2 có toạ độ hợp lệ)
                    + CASE 
                        WHEN @Latitude IS NOT NULL AND @Longitude IS NOT NULL 
                             AND p.Latitude IS NOT NULL AND p.Longitude IS NOT NULL THEN
                            20.0 / (1.0 + SQRT(
                                POWER(CAST((p.Latitude - @Latitude) * 111.0 AS FLOAT), 2) +
                                POWER(CAST((p.Longitude - @Longitude) * 111.0 AS FLOAT) * COS(RADIANS(CAST(@Latitude AS FLOAT))), 2)
                            ))
                        ELSE 0.0 
                    END
                    -- D. Chất lượng & Mức độ phổ biến
                    + (p.AvgRating * 3.0)
                    + (LOG(CAST(p.ReviewCount + 1 AS FLOAT)) * 2.0)
                    + (LOG(CAST(p.ViewCount + 1 AS FLOAT)) * 1.0)
                ) DESC,
                p.AvgRating DESC,
                p.ReviewCount DESC;";

        var candidates = await connection.QueryAsync<PlaceSummaryDto>(querySql, new
        {
            PlaceId = placeId,
            Limit = safeLimit,
            CategoryId = current.CategoryId,
            PlaceTypeId = current.PlaceTypeId,
            ProvinceId = current.ProvinceId,
            RegionId = current.RegionId,
            Latitude = current.Latitude,
            Longitude = current.Longitude
        });

        return candidates.ToList();
    }
}

file sealed class CurrentPlaceContext
{
    public long Id { get; set; }
    public int CategoryId { get; set; }
    public int PlaceTypeId { get; set; }
    public int ProvinceId { get; set; }
    public int RegionId { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
}

file sealed class RawPlaceFoodRow
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public string? ImageUrl { get; set; }
}

file sealed class RawFoodMediaRow
{
    public long FoodId { get; set; }
    public string Url { get; set; } = string.Empty;
}
