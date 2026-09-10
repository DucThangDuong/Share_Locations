using System.Text.RegularExpressions;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using Dapper;
using Infrastructure.Persistence;
using Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class RegionRepository : IRegionRepository
{
    private readonly TravelReviewDbContext _dbContext;

    public RegionRepository(TravelReviewDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<RegionDto>> GetAllAsync(CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        const string sql = @"
            SELECT r.Id, r.Name, r.Tagline, r.Description, r.ImageUrl, r.OrderIndex,
                   (SELECT COUNT(1) FROM dbo.Provinces p WHERE p.RegionId = r.Id AND p.Status = 1) AS ProvinceCount
            FROM dbo.Regions r
            WHERE r.Status = 1
            ORDER BY r.OrderIndex;

            SELECT p.Id, p.RegionId, p.Name, p.ImageUrl, p.Featured,
                   (SELECT COUNT(1) FROM dbo.Places pl WHERE pl.ProvinceId = p.Id AND pl.Status = 1) AS PlaceCount
            FROM dbo.Provinces p
            WHERE p.Status = 1
            ORDER BY p.DisplayOrder, p.Name;";

        using var multi = await connection.QueryMultipleAsync(sql);
        var regions = (await multi.ReadAsync<RegionDto>()).ToList();
        var provinces = (await multi.ReadAsync<ProvinceWithRegionRaw>()).ToList();

        var provincesByRegion = provinces.ToLookup(p => p.RegionId);

        foreach (var region in regions)
        {
            region.Provinces = provincesByRegion[region.Id].Select(p => (ProvinceSummaryDto)p).ToList();
        }

        return regions;
    }

    public async Task<RegionLandingDto?> GetRegionLandingAsync(string regionCode, CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        var pattern = regionCode.ToLowerInvariant() switch
        {
            "north" => "%Bắc%",
            "central" => "%Trung%",
            "south" => "%Nam%",
            _ => $"%{regionCode}%"
        };

        // 1. Query Region
        const string regionSql = @"
            SELECT TOP 1 r.Id, r.Name, r.Tagline, r.Description, r.ImageUrl
            FROM dbo.Regions r
            WHERE r.Status = 1
              AND (
                (@Code = 'north' AND (r.Name LIKE N'%Bắc%' OR r.Name LIKE '%North%')) OR
                (@Code = 'central' AND (r.Name LIKE N'%Trung%' OR r.Name LIKE '%Central%')) OR
                (@Code = 'south' AND (r.Name LIKE N'%Nam%' OR r.Name LIKE '%South%')) OR
                r.Name LIKE @Pattern
              )
            ORDER BY r.OrderIndex;";

        var regionRow = await connection.QueryFirstOrDefaultAsync(regionSql, new { Code = regionCode.ToLowerInvariant(), Pattern = pattern });
        if (regionRow == null)
        {
            return null;
        }

        int regionId = (int)regionRow.Id;
        string regionName = (string)regionRow.Name;
        string? regionTagline = (string?)regionRow.Tagline;
        string? regionDesc = (string?)regionRow.Description;
        string? regionImg = (string?)regionRow.ImageUrl;

        var dto = new RegionLandingDto
        {
            Code = regionCode.ToLowerInvariant(),
            Name = regionName,
            ShortTitle = !string.IsNullOrWhiteSpace(regionTagline) ? regionTagline : regionName,
            BadgeText = $"Khu vực: {regionName}",
            HeroHeadline = !string.IsNullOrWhiteSpace(regionTagline) ? regionTagline : $"Khám phá vẻ đẹp bất tận của {regionName}",
            HeroSubheadline = !string.IsNullOrWhiteSpace(regionDesc) ? regionDesc : $"Hành trình trải nghiệm văn hoá, danh thắng và phong vị đặc sắc {regionName}."
        };

        // 2. Provinces
        const string provincesSql = @"
            SELECT p.Name
            FROM dbo.Provinces p
            WHERE p.RegionId = @RegionId AND p.Status = 1
            ORDER BY p.DisplayOrder, p.Name;";

        var provinceNames = (await connection.QueryAsync<string>(provincesSql, new { RegionId = regionId })).ToList();
        dto.Provinces = provinceNames;

        // 3. Hero Images (Region image + Top featured provinces)
        const string heroImagesSql = @"
            SELECT TOP 4 p.ImageUrl AS Url, p.Name AS Title, p.Name AS Location, ISNULL(p.Tagline, N'Điểm đến hấp dẫn') AS Tag
            FROM dbo.Provinces p
            WHERE p.RegionId = @RegionId AND p.Status = 1 AND p.ImageUrl IS NOT NULL AND p.ImageUrl != ''
            ORDER BY p.Featured DESC, p.DisplayOrder ASC;";

        var heroRows = (await connection.QueryAsync(heroImagesSql, new { RegionId = regionId })).ToList();
        var heroImages = new List<RegionHeroImageDto>();

        if (!string.IsNullOrEmpty(regionImg))
        {
            heroImages.Add(new RegionHeroImageDto
            {
                Url = regionImg,
                Title = regionName,
                Location = regionName,
                Tag = regionTagline ?? "Kỳ quan vùng miền"
            });
        }

        foreach (var h in heroRows)
        {
            heroImages.Add(new RegionHeroImageDto
            {
                Url = (string)h.Url,
                Title = (string)h.Title,
                Location = (string)h.Location,
                Tag = (string)h.Tag
            });
        }
        dto.HeroImages = heroImages;

        // 4. Collections
        const string collectionsSql = @"
            SELECT TOP 4
                c.Id,
                c.Title,
                c.Description AS Subtitle,
                (SELECT COUNT(1) FROM dbo.CollectionPlaces cp WHERE cp.CollectionId = c.Id) AS PlaceCount
            FROM dbo.Collections c
            WHERE c.Status = 1
              AND (
                EXISTS (
                    SELECT 1 FROM dbo.Provinces prov
                    WHERE prov.Id = c.ProvinceId AND prov.RegionId = @RegionId
                )
                OR EXISTS (
                    SELECT 1 FROM dbo.CollectionPlaces cp
                    INNER JOIN dbo.Places pl ON cp.PlaceId = pl.Id
                    INNER JOIN dbo.Provinces plprov ON pl.ProvinceId = plprov.Id
                    WHERE cp.CollectionId = c.Id AND plprov.RegionId = @RegionId
                )
              )
            ORDER BY c.DisplayOrder, c.Id;";

        var collectionRows = (await connection.QueryAsync(collectionsSql, new { RegionId = regionId })).ToList();

        if (collectionRows.Count == 0)
        {
            const string fallbackCollectionsSql = @"
                SELECT TOP 4
                    c.Id,
                    c.Title,
                    c.Description AS Subtitle,
                    (SELECT COUNT(1) FROM dbo.CollectionPlaces cp WHERE cp.CollectionId = c.Id) AS PlaceCount
                FROM dbo.Collections c
                WHERE c.Status = 1 AND c.IsFeatured = 1
                ORDER BY c.DisplayOrder, c.Id;";
            collectionRows = (await connection.QueryAsync(fallbackCollectionsSql)).ToList();
        }

        var collections = new List<RegionCollectionDto>();

        if (collectionRows.Count > 0)
        {
            var colIds = collectionRows.Select(c => (int)c.Id).ToList();

            const string colPlacesSql = @"
                SELECT cp.CollectionId, p.Id, p.Name, p.AvgRating, p.ReviewCount, cat.Name AS CategoryName, p.CoverImageUrl
                FROM dbo.CollectionPlaces cp
                INNER JOIN dbo.Places p ON cp.PlaceId = p.Id
                LEFT JOIN dbo.Categories cat ON p.CategoryId = cat.Id
                WHERE cp.CollectionId IN @ColIds AND p.Status = 1
                ORDER BY cp.CollectionId, cp.DisplayOrder;";

            var colPlaceRows = (await connection.QueryAsync<PlaceInCollectionRaw>(colPlacesSql, new { ColIds = colIds })).ToList();

            const string colPlaceMediaSql = @"
                SELECT pm.PlaceId, pm.Url
                FROM dbo.PlaceMedia pm
                INNER JOIN dbo.CollectionPlaces cp ON pm.PlaceId = cp.PlaceId
                WHERE cp.CollectionId IN @ColIds
                ORDER BY pm.PlaceId, pm.DisplayOrder;";

            var colMediaRows = (await connection.QueryAsync<PlaceMediaRaw>(colPlaceMediaSql, new { ColIds = colIds })).ToList();
            var mediaByPlace = colMediaRows.ToLookup(m => m.PlaceId, m => m.Url);

            var placeCardsByCollection = colPlaceRows.Select(p =>
            {
                var mediaList = mediaByPlace[p.Id].Distinct().ToList();
                if (mediaList.Count == 0 && !string.IsNullOrWhiteSpace(p.CoverImageUrl))
                {
                    mediaList.Add(p.CoverImageUrl);
                }

                return new
                {
                    p.CollectionId,
                    Card = new PlaceCardDto
                    {
                        Id = p.Id,
                        Name = p.Name,
                        CategoryName = p.CategoryName,
                        AvgRating = p.AvgRating,
                        ReviewCount = p.ReviewCount,
                        MediaUrls = mediaList
                    }
                };
            }).ToLookup(p => p.CollectionId, p => p.Card);

            foreach (var c in collectionRows)
            {
                var id = (int)c.Id;
                var places = placeCardsByCollection[id].ToList();

                collections.Add(new RegionCollectionDto
                {
                    Id = id,
                    Title = (string)c.Title,
                    Subtitle = (string?)c.Subtitle,
                    PlaceCount = (int)(c.PlaceCount ?? places.Count),
                    Places = places
                });
            }
        }
        dto.Collections = collections;

        // 5. Landmarks (Places in region)
        const string landmarksSql = @"
            SELECT TOP 8
                p.Id,
                p.Name,
                prov.Name AS Province,
                p.Address AS Location,
                CAST(p.Latitude AS FLOAT) AS Latitude,
                CAST(p.Longitude AS FLOAT) AS Longitude,
                CAST(p.AvgRating AS FLOAT) AS Rating,
                p.ReviewCount,
                (SELECT COUNT(1) FROM dbo.Favorites f WHERE f.TargetId = p.Id AND f.TargetType = 1) AS SavedCount,
                COALESCE(p.CoverImageUrl, (SELECT TOP 1 pm.Url FROM dbo.PlaceMedia pm WHERE pm.PlaceId = p.Id ORDER BY pm.DisplayOrder)) AS ImageUrl,
                cat.Name AS Category,
                p.MinPrice,
                p.MaxPrice
            FROM dbo.Places p
            INNER JOIN dbo.Provinces prov ON p.ProvinceId = prov.Id
            INNER JOIN dbo.Categories cat ON p.CategoryId = cat.Id
            WHERE prov.RegionId = @RegionId AND p.Status = 1
            ORDER BY p.AvgRating DESC, p.ReviewCount DESC;";

        var landmarkRows = (await connection.QueryAsync(landmarksSql, new { RegionId = regionId })).ToList();
        var landmarks = new List<RegionLandmarkDto>();

        if (landmarkRows.Count > 0)
        {
            var placeIds = landmarkRows.Select(l => (long)l.Id).ToList();
            const string placeMediaSql = @"
                SELECT pm.PlaceId, pm.Url
                FROM dbo.PlaceMedia pm
                WHERE pm.PlaceId IN @PlaceIds
                ORDER BY pm.DisplayOrder;";

            var placeMediaRows = (await connection.QueryAsync(placeMediaSql, new { PlaceIds = placeIds })).ToList();
            var placeMediaLookup = placeMediaRows
                .Where(r => r.Url != null)
                .ToLookup(r => (long)r.PlaceId, r => (string)r.Url);

            foreach (var p in landmarkRows)
            {
                var pid = (long)p.Id;
                double[]? coords = null;
                if (p.Latitude != null && p.Longitude != null)
                {
                    coords = new double[] { (double)p.Latitude, (double)p.Longitude };
                }

                string priceText = p.MinPrice != null
                    ? $"Từ {Convert.ToDecimal(p.MinPrice):N0}đ"
                    : "Miễn phí";

                var mediaUrls = placeMediaLookup[pid].Distinct().Take(4).ToList();
                if (mediaUrls.Count == 0 && !string.IsNullOrEmpty((string?)p.ImageUrl))
                {
                    mediaUrls.Add((string)p.ImageUrl);
                }

                landmarks.Add(new RegionLandmarkDto
                {
                    Id = pid,
                    Name = (string)p.Name,
                    Province = (string)p.Province,
                    Location = (string)(p.Location ?? string.Empty),
                    Coordinates = coords,
                    Rating = p.Rating != null ? Math.Round((double)p.Rating, 2) : 5.0,
                    ReviewCount = (int)(p.ReviewCount ?? 0),
                    SavedCount = (int)(p.SavedCount ?? 0),
                    ImageUrl = (string?)p.ImageUrl ?? regionImg,
                    MediaUrls = mediaUrls,
                    Category = (string?)p.Category ?? "Địa danh nổi bật",
                    Price = priceText
                });
            }
        }
        dto.Landmarks = landmarks;

        // 6. Foods (via FoodProvinces and FoodPlaces)
        const string foodsSql = @"
            SELECT TOP 6
                f.Id,
                f.Name,
                COALESCE(
                    (SELECT TOP 1 p.Name FROM dbo.FoodProvinces fp2 INNER JOIN dbo.Provinces p ON fp2.ProvinceId = p.Id WHERE fp2.FoodId = f.Id AND p.RegionId = @RegionId),
                    (SELECT TOP 1 prov2.Name FROM dbo.FoodPlaces fpl2 INNER JOIN dbo.Places pl2 ON fpl2.PlaceId = pl2.Id INNER JOIN dbo.Provinces prov2 ON pl2.ProvinceId = prov2.Id WHERE fpl2.FoodId = f.Id AND prov2.RegionId = @RegionId),
                    @RegionName
                ) AS Province,
                f.Description,
                f.CoverImageUrl AS ImageUrl,
                (SELECT COUNT(1) FROM dbo.FoodPlaces fp2 WHERE fp2.FoodId = f.Id) AS SuggestedPlacesCount
            FROM dbo.Foods f
            WHERE f.Status = 1
              AND (
                EXISTS (
                    SELECT 1 FROM dbo.FoodProvinces fp
                    INNER JOIN dbo.Provinces prov ON fp.ProvinceId = prov.Id
                    WHERE fp.FoodId = f.Id AND prov.RegionId = @RegionId
                )
                OR EXISTS (
                    SELECT 1 FROM dbo.FoodPlaces fpl
                    INNER JOIN dbo.Places pl ON fpl.PlaceId = pl.Id
                    INNER JOIN dbo.Provinces prov2 ON pl.ProvinceId = prov2.Id
                    WHERE fpl.FoodId = f.Id AND prov2.RegionId = @RegionId
                )
              )
            ORDER BY f.Id DESC;";

        var foodRows = (await connection.QueryAsync(foodsSql, new { RegionId = regionId, RegionName = regionName })).ToList();
        var foods = new List<RegionFoodDto>();

        if (foodRows.Count > 0)
        {
            var foodIds = foodRows.Select(f => (long)f.Id).ToList();

            const string suggestedPlacesSql = @"
                SELECT
                    fpl.FoodId,
                    pl.Id,
                    pl.Name,
                    pl.Address,
                    CAST(pl.AvgRating AS FLOAT) AS Rating,
                    CAST(pl.Latitude AS FLOAT) AS Latitude,
                    CAST(pl.Longitude AS FLOAT) AS Longitude
                FROM dbo.FoodPlaces fpl
                INNER JOIN dbo.Places pl ON fpl.PlaceId = pl.Id
                WHERE fpl.FoodId IN @FoodIds AND pl.Status = 1;";

            var spRows = (await connection.QueryAsync(suggestedPlacesSql, new { FoodIds = foodIds })).ToList();
            var spLookup = spRows.ToLookup(r => (long)r.FoodId);

            const string foodMediaSql = @"
                SELECT fm.FoodId, fm.Url
                FROM dbo.FoodMedia fm
                WHERE fm.FoodId IN @FoodIds
                ORDER BY fm.DisplayOrder;";

            var foodMediaRows = (await connection.QueryAsync(foodMediaSql, new { FoodIds = foodIds })).ToList();
            var foodMediaLookup = foodMediaRows
                .Where(r => r.Url != null)
                .ToLookup(r => (long)r.FoodId, r => (string)r.Url);

            foreach (var f in foodRows)
            {
                var fid = (long)f.Id;
                var spList = new List<RegionFoodSuggestedPlaceDto>();
                double[]? coords = null;

                foreach (var sp in spLookup[fid])
                {
                    double[]? spCoords = null;
                    if (sp.Latitude != null && sp.Longitude != null)
                    {
                        spCoords = new double[] { (double)sp.Latitude, (double)sp.Longitude };
                        coords ??= spCoords;
                    }

                    spList.Add(new RegionFoodSuggestedPlaceDto
                    {
                        Id = (long)sp.Id,
                        Name = (string)sp.Name,
                        Address = (string)(sp.Address ?? string.Empty),
                        Rating = sp.Rating != null ? Math.Round((double)sp.Rating, 2) : 5.0,
                        Coordinates = spCoords
                    });
                }

                var mediaUrls = foodMediaLookup[fid].Distinct().Take(4).ToList();
                if (mediaUrls.Count == 0 && !string.IsNullOrEmpty((string?)f.ImageUrl))
                {
                    mediaUrls.Add((string)f.ImageUrl);
                }

                foods.Add(new RegionFoodDto
                {
                    Id = fid,
                    Name = (string)f.Name,
                    Province = (string)f.Province,
                    Description = (string?)f.Description,
                    ImageUrl = (string?)f.ImageUrl,
                    MediaUrls = mediaUrls,
                    Type = "dine-in",
                    PriceRange = "40.000đ - 100.000đ",
                    SuggestedPlacesCount = (int)(f.SuggestedPlacesCount ?? spList.Count),
                    Coordinates = coords,
                    SuggestedPlaces = spList
                });
            }
        }
        dto.Foods = foods;

        // 7. Blog Posts
        const string blogsSql = @"
            SELECT TOP 4
                b.Id,
                b.Title,
                b.Excerpt,
                b.CoverImageUrl,
                b.CreatedAt,
                b.ReadTimeMinutes,
                b.ViewCount,
                ISNULL(up.FullName, N'Lang Thang Blogger') AS AuthorName,
                up.AvatarUrl AS AuthorAvatar,
                c.Name AS CategoryName
            FROM dbo.Blogs b
            LEFT JOIN dbo.UserProfiles up ON b.AuthorId = up.UserId
            LEFT JOIN dbo.Categories c ON b.CategoryId = c.Id
            WHERE b.Status = 1
            ORDER BY
                CASE WHEN (b.Title LIKE @Pattern OR b.Excerpt LIKE @Pattern) THEN 0 ELSE 1 END,
                b.ViewCount DESC, b.CreatedAt DESC;";

        var blogRows = (await connection.QueryAsync(blogsSql, new { Pattern = pattern })).ToList();
        var blogPosts = new List<RegionBlogPostDto>();

        foreach (var b in blogRows)
        {
            var bid = (long)b.Id;
            var catName = (string?)b.CategoryName ?? "Cẩm nang du lịch";
            var created = (DateTime)b.CreatedAt;
            var readMinutes = (int)(b.ReadTimeMinutes ?? 5);

            var title = (string)b.Title;
            var slug = GenerateSlug(title);

            blogPosts.Add(new RegionBlogPostDto
            {
                Id = bid,
                Slug = slug,
                Title = title,
                Excerpt = (string?)b.Excerpt,
                CoverUrl = (string?)b.CoverImageUrl ?? regionImg,
                PublishedAt = created.ToString("dd/MM/yyyy"),
                ReadTime = $"{readMinutes} phút đọc",
                Category = catName,
                Location = regionName,
                Rating = 5.0,
                ReviewCount = Math.Max(12, (int)((b.ViewCount ?? 0) / 100)),
                Tags = new List<string> { $"#{catName.Replace(" ", "")}", $"#{regionName.Replace(" ", "")}" },
                StatusOrHours = "Khám phá tự do",
                Author = new RegionBlogAuthorDto
                {
                    Name = (string)b.AuthorName,
                    Avatar = (string?)b.AuthorAvatar
                }
            });
        }
        dto.BlogPosts = blogPosts;

        // 8. Spotlight
        const string spotlightSql = @"
            SELECT TOP 1
                p.Id,
                p.Name,
                p.Tagline,
                p.Description,
                COALESCE(p.ImageUrl, (SELECT TOP 1 pl.CoverImageUrl FROM dbo.Places pl WHERE pl.ProvinceId = p.Id AND pl.CoverImageUrl IS NOT NULL)) AS BannerUrl,
                (SELECT COUNT(1) FROM dbo.Reviews rev INNER JOIN dbo.Places pl ON rev.PlaceId = pl.Id WHERE pl.ProvinceId = p.Id AND rev.Status = 1) AS TotalReviews,
                (SELECT AVG(CAST(pl.AvgRating AS FLOAT)) FROM dbo.Places pl WHERE pl.ProvinceId = p.Id AND pl.Status = 1) AS AvgRating,
                (SELECT TOP 1 CAST(pl.Latitude AS FLOAT) FROM dbo.Places pl WHERE pl.ProvinceId = p.Id AND pl.Latitude IS NOT NULL) AS Latitude,
                (SELECT TOP 1 CAST(pl.Longitude AS FLOAT) FROM dbo.Places pl WHERE pl.ProvinceId = p.Id AND pl.Longitude IS NOT NULL) AS Longitude
            FROM dbo.Provinces p
            WHERE p.RegionId = @RegionId AND p.Status = 1
            ORDER BY p.Featured DESC, p.DisplayOrder ASC;";

        var spotRow = await connection.QueryFirstOrDefaultAsync(spotlightSql, new { RegionId = regionId });
        if (spotRow != null)
        {
            int spotProvId = (int)spotRow.Id;
            const string spotHighlightsSql = @"
                SELECT TOP 3 pl.Name
                FROM dbo.Places pl
                WHERE pl.ProvinceId = @ProvId AND pl.Status = 1
                ORDER BY pl.AvgRating DESC, pl.ReviewCount DESC;";

            var spotHighlights = (await connection.QueryAsync<string>(spotHighlightsSql, new { ProvId = spotProvId })).ToList();
            if (spotHighlights.Count == 0)
            {
                spotHighlights = new List<string> { $"Di sản & Cảnh quan {(string)spotRow.Name}", "Ẩm thực bản sắc", "Văn hoá ngàn năm" };
            }

            double[]? spotCoords = null;
            if (spotRow.Latitude != null && spotRow.Longitude != null)
            {
                spotCoords = new double[] { (double)spotRow.Latitude, (double)spotRow.Longitude };
            }

            dto.Spotlight = new RegionSpotlightDto
            {
                Id = $"spotlight-{GenerateSlug((string)spotRow.Name)}",
                Title = (string)spotRow.Name,
                Subtitle = (string?)spotRow.Tagline ?? $"Điểm đến tiêu biểu {regionName}",
                Description = (string?)spotRow.Description ?? $"Khám phá những nét đặc sắc nhất của {(string)spotRow.Name}.",
                Province = (string)spotRow.Name,
                TotalReviews = (int)(spotRow.TotalReviews ?? 0),
                AvgRating = spotRow.AvgRating != null ? Math.Round((double)spotRow.AvgRating, 2) : 5.0,
                BannerUrl = (string?)spotRow.BannerUrl ?? regionImg ?? "",
                Coordinates = spotCoords,
                Highlights = spotHighlights
            };
        }

        // 9. Reviews
        const string reviewsSql = @"
            SELECT TOP 6
                rev.Id,
                ISNULL(up.FullName, u.Email) AS ReviewerName,
                up.AvatarUrl AS ReviewerAvatar,
                CAST(rev.Rating AS INT) AS Rating,
                p.Name AS PlaceName,
                p.Id AS PlaceId,
                rev.CreatedAt,
                rev.Content,
                CAST(p.Latitude AS FLOAT) AS Latitude,
                CAST(p.Longitude AS FLOAT) AS Longitude
            FROM dbo.Reviews rev
            INNER JOIN dbo.Places p ON rev.PlaceId = p.Id
            INNER JOIN dbo.Provinces prov ON p.ProvinceId = prov.Id
            INNER JOIN dbo.Users u ON rev.UserId = u.Id
            LEFT JOIN dbo.UserProfiles up ON u.Id = up.UserId
            WHERE prov.RegionId = @RegionId AND rev.Status = 1 AND p.Status = 1
            ORDER BY rev.CreatedAt DESC;";

        var reviewRows = (await connection.QueryAsync(reviewsSql, new { RegionId = regionId })).ToList();
        var reviews = new List<RegionReviewDto>();

        if (reviewRows.Count > 0)
        {
            var revIds = reviewRows.Select(r => (long)r.Id).ToList();
            const string revMediaSql = @"
                SELECT rm.ReviewId, rm.Url
                FROM dbo.ReviewMedia rm
                WHERE rm.ReviewId IN @RevIds
                ORDER BY rm.Id;";

            var revMediaRows = (await connection.QueryAsync(revMediaSql, new { RevIds = revIds })).ToList();
            var revMediaLookup = revMediaRows
                .Where(r => r.Url != null)
                .ToLookup(r => (long)r.ReviewId, r => (string)r.Url);

            foreach (var r in reviewRows)
            {
                var rid = (long)r.Id;
                double[]? coords = null;
                if (r.Latitude != null && r.Longitude != null)
                {
                    coords = new double[] { (double)r.Latitude, (double)r.Longitude };
                }

                DateTime createdAt = (DateTime)r.CreatedAt;
                var days = (DateTime.UtcNow - createdAt).TotalDays;
                var visitDate = days < 1 ? "Hôm nay" : $"{(int)days} ngày trước";

                reviews.Add(new RegionReviewDto
                {
                    Id = rid,
                    ReviewerName = (string)(r.ReviewerName ?? "Du khách"),
                    ReviewerAvatar = (string?)r.ReviewerAvatar,
                    Rating = (int)(r.Rating ?? 5),
                    PlaceName = (string)(r.PlaceName ?? string.Empty),
                    PlaceId = (long)r.PlaceId,
                    VisitDate = visitDate,
                    Content = (string)(r.Content ?? string.Empty),
                    Images = revMediaLookup[rid].Distinct().Take(4).ToList(),
                    LikesCount = 10 + (int)(rid % 60),
                    Coordinates = coords
                });
            }
        }
        dto.Reviews = reviews;

        return dto;
    }

    private static string GenerateSlug(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return string.Empty;

        var normalized = text.Trim().ToLowerInvariant();
        normalized = Regex.Replace(normalized, @"[áàảãạâấầẩẫậăắằẳẵặ]", "a");
        normalized = Regex.Replace(normalized, @"[éèẻẽẹêếềểễệ]", "e");
        normalized = Regex.Replace(normalized, @"[íìỉĩị]", "i");
        normalized = Regex.Replace(normalized, @"[óòỏõọôốồổỗộơớờởỡợ]", "o");
        normalized = Regex.Replace(normalized, @"[úùủũụưứừửữự]", "u");
        normalized = Regex.Replace(normalized, @"[ýỳỷỹỵ]", "y");
        normalized = Regex.Replace(normalized, @"đ", "d");
        normalized = Regex.Replace(normalized, @"[^a-z0-9\s-]", "");
        normalized = Regex.Replace(normalized, @"\s+", "-").Trim('-');

        return normalized;
    }
}
