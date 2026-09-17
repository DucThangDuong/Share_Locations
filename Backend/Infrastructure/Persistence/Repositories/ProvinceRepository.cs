using System.Globalization;
using System.Text.RegularExpressions;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using Dapper;
using Infrastructure.Persistence;
using Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class ProvinceRepository : IProvinceRepository
{
    private static readonly CultureInfo ViCulture = CultureInfo.GetCultureInfo("vi-VN");
    private readonly TravelReviewDbContext _dbContext;

    public ProvinceRepository(TravelReviewDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<ProvinceDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        const string sql = @"
            SELECT 
                p.Id,
                p.RegionId,
                r.Name AS RegionName,
                p.Name,
                p.Tagline,
                p.Description,
                p.ImageUrl,
                p.Featured,
                p.DisplayOrder,
                (SELECT COUNT(1) FROM dbo.Places pl WHERE pl.ProvinceId = p.Id AND pl.Status = 1) AS PlaceCount
            FROM dbo.Provinces p
            LEFT JOIN dbo.Regions r ON p.RegionId = r.Id
            WHERE p.Status = 1
            ORDER BY p.DisplayOrder, p.Name;";

        var provinces = await connection.QueryAsync<ProvinceDto>(sql);
        return provinces.ToList();
    }

    public async Task<ProvinceLandingDto?> GetProvinceLandingAsync(string idOrSlug, CancellationToken cancellationToken = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        const string allProvSql = @"
            SELECT 
                p.Id,
                p.RegionId,
                r.Name AS RegionName,
                p.Name,
                p.Tagline,
                p.Description,
                p.ImageUrl,
                p.Featured,
                p.DisplayOrder,
                (SELECT COUNT(1) FROM dbo.Places pl WHERE pl.ProvinceId = p.Id AND pl.Status = 1) AS PlaceCount
            FROM dbo.Provinces p
            LEFT JOIN dbo.Regions r ON p.RegionId = r.Id
            WHERE p.Status = 1
            ORDER BY p.DisplayOrder, p.Name;";

        var allProvinces = (await connection.QueryAsync<ProvinceDto>(allProvSql)).ToList();
        if (allProvinces.Count == 0) return null;

        ProvinceDto? provDto = null;
        var input = (idOrSlug ?? string.Empty).Trim();

        if (int.TryParse(input, out int pid))
        {
            provDto = allProvinces.FirstOrDefault(p => p.Id == pid);
        }

        if (provDto == null)
        {
            var cleanSlug = GenerateSlug(input);
            var rawInputNoHyphen = cleanSlug.Replace("-", "");

            provDto = allProvinces.FirstOrDefault(p =>
                p.Name.Equals(input, StringComparison.OrdinalIgnoreCase) ||
                GenerateSlug(p.Name).Equals(cleanSlug, StringComparison.OrdinalIgnoreCase) ||
                GenerateSlug(p.Name).Replace("-", "").Equals(rawInputNoHyphen, StringComparison.OrdinalIgnoreCase)
            );

            if (provDto == null && !string.IsNullOrEmpty(rawInputNoHyphen))
            {
                provDto = allProvinces.FirstOrDefault(p =>
                    GenerateSlug(p.Name).Replace("-", "").Contains(rawInputNoHyphen, StringComparison.OrdinalIgnoreCase) ||
                    rawInputNoHyphen.Contains(GenerateSlug(p.Name).Replace("-", ""), StringComparison.OrdinalIgnoreCase)
                );
            }
        }

        if (provDto == null) return null;

        int provId = provDto.Id;
        string provName = provDto.Name;
        string regionName = string.IsNullOrEmpty(provDto.RegionName) ? "Việt Nam" : provDto.RegionName;

        var dto = new ProvinceLandingDto
        {
            Province = provDto,
            HeroHeadline = $"Khám phá {provName}",
            HeroSubheadline = provDto.Tagline ?? $"Hành trình trải nghiệm trọn vẹn văn hoá, ẩm thực và danh thắng tại {provName}"
        };

        // 1. Hero Images (from places in this province)
        const string heroImgSql = @"
            SELECT TOP 5 COALESCE(pl.CoverImageUrl, pm.Url) AS Url, pl.Name AS Title, @ProvName AS Location, ISNULL(cat.Name, N'Địa danh nổi bật') AS Tag
            FROM dbo.Places pl
            LEFT JOIN dbo.PlaceMedia pm ON pm.PlaceId = pl.Id
            LEFT JOIN dbo.Categories cat ON pl.CategoryId = cat.Id
            WHERE pl.ProvinceId = @ProvId AND pl.Status = 1 AND (pl.CoverImageUrl IS NOT NULL OR pm.Url IS NOT NULL)
            ORDER BY pl.AvgRating DESC, pl.ReviewCount DESC;";

        var heroRows = (await connection.QueryAsync(heroImgSql, new { ProvId = provId, ProvName = provName })).ToList();
        var heroImages = new List<RegionHeroImageDto>();

        if (!string.IsNullOrEmpty(provDto.ImageUrl))
        {
            heroImages.Add(new RegionHeroImageDto
            {
                Url = provDto.ImageUrl,
                Title = provName,
                Location = provName,
                Tag = provDto.Tagline ?? "Điểm đến hấp dẫn"
            });
        }

        foreach (var h in heroRows)
        {
            if (h.Url != null && !heroImages.Any(x => x.Url == (string)h.Url))
            {
                heroImages.Add(new RegionHeroImageDto
                {
                    Url = (string)h.Url,
                    Title = (string)h.Title,
                    Location = (string)h.Location,
                    Tag = (string)h.Tag
                });
            }
        }
        dto.HeroImages = heroImages;

        // 2. Collections (STRICTLY for this province only)
        var provPattern = $"%{provName}%";
        const string collectionsSql = @"
            SELECT
                c.Id,
                c.Title,
                c.Description AS Subtitle,
                (SELECT COUNT(1) FROM dbo.CollectionPlaces cp INNER JOIN dbo.Places pl ON cp.PlaceId = pl.Id WHERE cp.CollectionId = c.Id AND pl.ProvinceId = @ProvId AND pl.Status = 1) AS PlaceCount
            FROM dbo.Collections c
            WHERE c.Status = 1
              AND (
                c.ProvinceId = @ProvId
                OR (
                    c.ProvinceId IS NULL
                    AND (
                        c.Title LIKE @ProvPattern
                        OR c.Description LIKE @ProvPattern
                    )
                )
              )
            ORDER BY c.DisplayOrder, c.Id;";

        var collectionRows = (await connection.QueryAsync(collectionsSql, new { ProvId = provId, ProvPattern = provPattern })).ToList();
        var collections = new List<RegionCollectionDto>();

        if (collectionRows.Count > 0)
        {
            var colIds = collectionRows.Select(c => (long)c.Id).ToList();

            const string colPlacesSql = @"
                SELECT cp.CollectionId, p.Id, p.Name, p.AvgRating, p.ReviewCount, cat.Name AS CategoryName, p.CoverImageUrl
                FROM dbo.CollectionPlaces cp
                INNER JOIN dbo.Places p ON cp.PlaceId = p.Id
                LEFT JOIN dbo.Categories cat ON p.CategoryId = cat.Id
                WHERE cp.CollectionId IN @ColIds AND p.ProvinceId = @ProvId AND p.Status = 1
                ORDER BY cp.CollectionId, cp.DisplayOrder;";

            var colPlaceRows = (await connection.QueryAsync<PlaceInCollectionRaw>(colPlacesSql, new { ColIds = colIds, ProvId = provId })).ToList();

            const string colPlaceMediaSql = @"
                SELECT pm.PlaceId, pm.Url
                FROM dbo.PlaceMedia pm
                INNER JOIN dbo.CollectionPlaces cp ON pm.PlaceId = cp.PlaceId
                INNER JOIN dbo.Places pl ON pm.PlaceId = pl.Id
                WHERE cp.CollectionId IN @ColIds AND pl.ProvinceId = @ProvId AND pl.Status = 1
                ORDER BY pm.PlaceId, pm.DisplayOrder;";

            var colMediaRows = (await connection.QueryAsync<PlaceMediaRaw>(colPlaceMediaSql, new { ColIds = colIds, ProvId = provId })).ToList();
            var mediaByPlace = colMediaRows
                .Where(m => m.Url != null)
                .ToLookup(m => m.PlaceId, m => m.Url);

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
                if (places.Count > 0)
                {
                    collections.Add(new RegionCollectionDto
                    {
                        Id = id,
                        Title = (string)c.Title,
                        Subtitle = (string?)c.Subtitle,
                        PlaceCount = places.Count,
                        Places = places
                    });
                }
            }
        }
        dto.Collections = collections;

        // 3. Landmarks (STRICTLY in this province)
        const string landmarksSql = @"
            SELECT TOP 8
                p.Id,
                p.Name,
                prov.Name AS Province,
                p.Address AS Location,
                CAST(p.AvgRating AS FLOAT) AS Rating,
                p.ReviewCount,
                (SELECT COUNT(1) FROM dbo.Favorites f WHERE f.TargetType = 1 AND f.TargetId = p.Id) AS SavedCount,
                p.CoverImageUrl AS ImageUrl,
                cat.Name AS Category,
                p.MinPrice,
                CAST(p.Latitude AS FLOAT) AS Latitude,
                CAST(p.Longitude AS FLOAT) AS Longitude
            FROM dbo.Places p
            INNER JOIN dbo.Provinces prov ON p.ProvinceId = prov.Id
            LEFT JOIN dbo.Categories cat ON p.CategoryId = cat.Id
            WHERE p.ProvinceId = @ProvId AND p.Status = 1
            ORDER BY p.AvgRating DESC, p.ReviewCount DESC;";

        var landmarkRows = (await connection.QueryAsync(landmarksSql, new { ProvId = provId })).ToList();
        var landmarks = new List<RegionLandmarkDto>();

        if (landmarkRows.Count > 0)
        {
            var pIds = landmarkRows.Select(l => (long)l.Id).ToList();

            const string pMediaSql = @"
                SELECT pm.PlaceId, pm.Url
                FROM dbo.PlaceMedia pm
                WHERE pm.PlaceId IN @PlaceIds
                ORDER BY pm.PlaceId, pm.DisplayOrder;";

            var pMediaRows = (await connection.QueryAsync<PlaceMediaRaw>(pMediaSql, new { PlaceIds = pIds })).ToList();
            var landmarkMediaByPlace = pMediaRows
                .Where(r => r.Url != null)
                .ToLookup(m => m.PlaceId, m => m.Url);

            foreach (var l in landmarkRows)
            {
                var id = (long)l.Id;
                var mediaList = landmarkMediaByPlace[id].Distinct().ToList();
                if (mediaList.Count == 0 && l.ImageUrl != null)
                {
                    mediaList.Add((string)l.ImageUrl);
                }

                double[]? coords = null;
                if (l.Latitude != null && l.Longitude != null)
                {
                    coords = new double[] { (double)l.Latitude, (double)l.Longitude };
                }

                string priceText = l.MinPrice != null
                    ? $"Từ {Convert.ToDecimal(l.MinPrice).ToString("N0", ViCulture)}đ"
                    : "Miễn phí";

                landmarks.Add(new RegionLandmarkDto
                {
                    Id = id,
                    Name = (string)l.Name,
                    Province = (string)l.Province,
                    Location = (string)(l.Location ?? string.Empty),
                    Coordinates = coords,
                    Rating = l.Rating != null ? Math.Round((double)l.Rating, 2) : 5.0,
                    ReviewCount = (int)(l.ReviewCount ?? 0),
                    SavedCount = (int)(l.SavedCount ?? 0),
                    ImageUrl = (string?)l.ImageUrl ?? provDto.ImageUrl,
                    MediaUrls = mediaList,
                    Category = (string?)l.Category ?? "Địa danh nổi bật",
                    Price = priceText
                });
            }
        }
        dto.Landmarks = landmarks;

        // 4. Foods (STRICTLY belonging to or having places in this province)
        const string foodsSql = @"
            SELECT TOP 8
                f.Id,
                f.Name,
                @ProvName AS Province,
                f.Description,
                f.CoverImageUrl AS ImageUrl,
                f.MinPrice,
                f.MaxPrice,
                (SELECT COUNT(1) FROM dbo.FoodPlaces fp2 INNER JOIN dbo.Places pl ON fp2.PlaceId = pl.Id WHERE fp2.FoodId = f.Id AND pl.ProvinceId = @ProvId AND pl.Status = 1) AS SuggestedPlacesCount
            FROM dbo.Foods f
            WHERE f.Status = 1
              AND (
                EXISTS (
                    SELECT 1 FROM dbo.FoodProvinces fp
                    WHERE fp.FoodId = f.Id AND fp.ProvinceId = @ProvId
                )
                OR EXISTS (
                    SELECT 1 FROM dbo.FoodPlaces fpl
                    INNER JOIN dbo.Places pl ON fpl.PlaceId = pl.Id
                    WHERE fpl.FoodId = f.Id AND pl.ProvinceId = @ProvId AND pl.Status = 1
                )
              )
            ORDER BY f.Id DESC;";

        var foodRows = (await connection.QueryAsync(foodsSql, new { ProvId = provId, ProvName = provName })).ToList();
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
                WHERE fpl.FoodId IN @FoodIds AND pl.ProvinceId = @ProvId AND pl.Status = 1;";

            var spRows = (await connection.QueryAsync(suggestedPlacesSql, new { FoodIds = foodIds, ProvId = provId })).ToList();
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

                decimal? minPrice = f.MinPrice != null ? (decimal)f.MinPrice : null;
                decimal? maxPrice = f.MaxPrice != null ? (decimal)f.MaxPrice : null;
                string priceRange = "Đang cập nhật";
                if (minPrice.HasValue && maxPrice.HasValue && minPrice.Value > 0 && maxPrice.Value > 0)
                {
                    priceRange = $"{minPrice.Value.ToString("N0", ViCulture)}đ - {maxPrice.Value.ToString("N0", ViCulture)}đ";
                }
                else if (minPrice.HasValue && minPrice.Value > 0)
                {
                    priceRange = $"Từ {minPrice.Value.ToString("N0", ViCulture)}đ";
                }
                else if (maxPrice.HasValue && maxPrice.Value > 0)
                {
                    priceRange = $"Đến {maxPrice.Value.ToString("N0", ViCulture)}đ";
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
                    PriceRange = priceRange,
                    SuggestedPlacesCount = (int)(f.SuggestedPlacesCount ?? spList.Count),
                    Coordinates = coords,
                    SuggestedPlaces = spList
                });
            }
        }
        dto.Foods = foods;

        // 5. Blog Posts (STRICTLY matching this province)
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
            WHERE b.Status = 1 AND (b.Title LIKE @ProvPattern OR b.Excerpt LIKE @ProvPattern)
            ORDER BY b.ViewCount DESC, b.CreatedAt DESC;";

        var blogRows = (await connection.QueryAsync(blogsSql, new { ProvPattern = provPattern })).ToList();
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
                CoverUrl = (string?)b.CoverImageUrl ?? provDto.ImageUrl,
                PublishedAt = created.ToString("dd/MM/yyyy"),
                ReadTime = $"{readMinutes} phút đọc",
                Category = catName,
                Location = provName,
                Rating = 5.0,
                ReviewCount = Math.Max(12, (int)((b.ViewCount ?? 0) / 100)),
                Tags = new List<string> { $"#{catName.Replace(" ", "")}", $"#{provName.Replace(" ", "")}" },
                StatusOrHours = "Khám phá tự do",
                Author = new RegionBlogAuthorDto
                {
                    Name = (string)b.AuthorName,
                    Avatar = (string?)b.AuthorAvatar
                }
            });
        }
        dto.BlogPosts = blogPosts;

        // 6. Itineraries (STRICTLY matching this province or having places in this province)
        const string itinerariesSql = @"
            SELECT TOP 6
                t.Id,
                t.Title,
                t.Description AS Overview,
                t.CoverImageUrl AS CoverUrl,
                ISNULL(up.FullName, u.Email) AS AuthorName,
                up.AvatarUrl AS AuthorAvatar,
                (SELECT COUNT(1) FROM dbo.TripDays td WHERE td.TripId = t.Id) AS DaysCount,
                @ProvName AS Destination
            FROM dbo.Trips t
            INNER JOIN dbo.Users u ON t.UserId = u.Id
            LEFT JOIN dbo.UserProfiles up ON u.Id = up.UserId
            WHERE (
                t.Title LIKE @ProvPattern
                OR t.Description LIKE @ProvPattern
                OR EXISTS (
                    SELECT 1 FROM dbo.TripDays td
                    INNER JOIN dbo.TripPlaces tp ON td.Id = tp.TripDayId
                    INNER JOIN dbo.Places pl ON tp.PlaceId = pl.Id
                    WHERE td.TripId = t.Id AND pl.ProvinceId = @ProvId AND pl.Status = 1
                )
            )
            ORDER BY t.CreatedAt DESC;";

        var itinRows = (await connection.QueryAsync(itinerariesSql, new { ProvPattern = provPattern, ProvId = provId, ProvName = provName })).ToList();
        var itineraries = new List<ItineraryDto>();

        foreach (var it in itinRows)
        {
            var dCount = (int)(it.DaysCount ?? 1);
            if (dCount <= 0) dCount = 1;

            itineraries.Add(new ItineraryDto
            {
                Id = (int)it.Id,
                Title = (string)it.Title,
                Destination = (string)(it.Destination ?? provName),
                Region = regionName,
                Duration = $"{dCount} Ngày {Math.Max(1, dCount - 1)} Đêm",
                DaysCount = dCount,
                Style = "Khám phá & Trải nghiệm",
                EstimatedCost = "Linh hoạt",
                CoverUrl = (string?)it.CoverUrl ?? provDto.ImageUrl ?? "",
                Overview = (string?)it.Overview ?? $"Lịch trình khám phá trọn vẹn tại {provName}.",
                Author = new ItineraryAuthorDto
                {
                    Name = (string)it.AuthorName,
                    Avatar = (string?)it.AuthorAvatar
                }
            });
        }
        dto.Itineraries = itineraries;

        // 7. Reviews (STRICTLY in this province)
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
            INNER JOIN dbo.Users u ON rev.UserId = u.Id
            LEFT JOIN dbo.UserProfiles up ON u.Id = up.UserId
            WHERE p.ProvinceId = @ProvId AND rev.Status = 1 AND p.Status = 1
            ORDER BY rev.CreatedAt DESC;";

        var reviewRows = (await connection.QueryAsync(reviewsSql, new { ProvId = provId })).ToList();
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

        // 8. Spotlight (from top landmark in this province)
        if (landmarks.Count > 0)
        {
            var topPlace = landmarks[0];
            dto.Spotlight = new RegionSpotlightDto
            {
                Id = $"spotlight-{topPlace.Id}",
                Title = topPlace.Name,
                Subtitle = topPlace.Category ?? $"Địa danh biểu tượng {provName}",
                Description = $"Điểm đến được yêu thích hàng đầu tại {provName} với đánh giá {topPlace.Rating:F1}★ từ du khách.",
                Province = provName,
                TotalReviews = topPlace.ReviewCount,
                AvgRating = topPlace.Rating,
                BannerUrl = topPlace.ImageUrl ?? provDto.ImageUrl ?? "",
                Coordinates = topPlace.Coordinates,
                Highlights = landmarks.Take(3).Select(l => l.Name).ToList()
            };
        }
        else
        {
            dto.Spotlight = null;
        }

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
        normalized = Regex.Replace(normalized, @"[^a-z0-9s-]", "");
        normalized = Regex.Replace(normalized, @"s+", "-").Trim('-');

        return normalized;
    }
}
