using System.Data;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using Dapper;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class RankingRepository : IRankingRepository
{
    private readonly TravelReviewDbContext _dbContext;

    public RankingRepository(TravelReviewDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<RankingOverviewDto> GetRankingOverviewAsync(CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        const string settingsSql = "SELECT SettingKey, SettingValue FROM dbo.SystemSettings WHERE SettingGroup = 'RANKING';";
        var settingsRows = await connection.QueryAsync<(string SettingKey, string? SettingValue)>(
            new CommandDefinition(settingsSql, cancellationToken: ct));
        var settingsDict = settingsRows.ToDictionary(x => x.SettingKey, x => x.SettingValue, StringComparer.OrdinalIgnoreCase);

        string? rankingTitle = settingsDict.GetValueOrDefault("RANKING_TITLE");
        string? rankingSubtitle = settingsDict.GetValueOrDefault("RANKING_SUBTITLE");
        string? destTitle = settingsDict.GetValueOrDefault("RANKING_DESTINATIONS_TITLE");
        string? destVnTitle = settingsDict.GetValueOrDefault("RANKING_DESTINATIONS_VN_TITLE");
        string? destCover = settingsDict.GetValueOrDefault("RANKING_DESTINATIONS_COVER");

        string? placesTitle = settingsDict.GetValueOrDefault("RANKING_PLACES_TITLE");
        string? placesVnTitle = settingsDict.GetValueOrDefault("RANKING_PLACES_VN_TITLE");
        string? placesCover = settingsDict.GetValueOrDefault("RANKING_PLACES_COVER");

        string? placesBanner = placesCover;
        if (string.IsNullOrWhiteSpace(placesBanner))
        {
            const string placeBannerSql = @"
                SELECT TOP 1 COALESCE(NULLIF(p.CoverImageUrl, ''), pm.Url)
                FROM dbo.Places p
                LEFT JOIN dbo.PlaceMedia pm ON pm.PlaceId = p.Id
                WHERE p.Status = 1 AND p.IsDeleted = 0
                ORDER BY p.AvgRating DESC, p.ReviewCount DESC;";
            placesBanner = await connection.QueryFirstOrDefaultAsync<string>(new CommandDefinition(placeBannerSql, cancellationToken: ct));
        }

        string? provBanner = destCover;
        if (string.IsNullOrWhiteSpace(provBanner))
        {
            const string provBannerSql = @"
                SELECT TOP 1 pr.ImageUrl
                FROM dbo.Provinces pr
                WHERE pr.Status = 1 AND pr.ImageUrl IS NOT NULL AND pr.ImageUrl != ''
                ORDER BY pr.DisplayOrder, pr.Id;";
            provBanner = await connection.QueryFirstOrDefaultAsync<string>(new CommandDefinition(provBannerSql, cancellationToken: ct));
        }

        var categories = new List<RankingOverviewCategoryDto>();

        if (!string.IsNullOrWhiteSpace(placesTitle) || !string.IsNullOrWhiteSpace(placesVnTitle))
        {
            categories.Add(new RankingOverviewCategoryDto
            {
                Key = "places",
                Type = "place",
                PlaceTypeId = null,
                Title = placesTitle,
                VietnameseTitle = placesVnTitle,
                CoverImageUrl = placesBanner
            });
        }

        if (!string.IsNullOrWhiteSpace(destTitle) || !string.IsNullOrWhiteSpace(destVnTitle))
        {
            categories.Add(new RankingOverviewCategoryDto
            {
                Key = "destinations",
                Type = "province",
                PlaceTypeId = null,
                Title = destTitle,
                VietnameseTitle = destVnTitle,
                CoverImageUrl = provBanner
            });
        }

        const string ptSql = @"
            SELECT
                pt.Id,
                pt.Name,
                pt.Slug,
                pt.EnglishName,
                pt.ImageUrl
            FROM dbo.PlaceTypes pt
            WHERE pt.Status = 1 AND pt.Id IN (1, 2, 3, 4)
            ORDER BY pt.DisplayOrder, pt.Id;";

        var pts = (await connection.QueryAsync(new CommandDefinition(ptSql, cancellationToken: ct))).ToList();

        foreach (var pt in pts)
        {
            int ptId = (int)pt.Id;
            string ptName = (string)pt.Name;
            string? ptSlug = (string?)pt.Slug;
            string? ptEnglishName = (string?)pt.EnglishName;
            string? ptImage = (string?)pt.ImageUrl;

            categories.Add(new RankingOverviewCategoryDto
            {
                Key = !string.IsNullOrWhiteSpace(ptSlug) ? ptSlug : $"place-type-{ptId}",
                Type = "place_type",
                PlaceTypeId = ptId,
                Title = ptEnglishName ?? ptName,
                VietnameseTitle = ptName,
                CoverImageUrl = ptImage
            });
        }

        return new RankingOverviewDto
        {
            Title = rankingTitle,
            Subtitle = rankingSubtitle,
            Categories = categories
        };
    }

    public async Task<RankingDetailViewDto> GetRankingDetailAsync(
        string type,
        int? placeTypeId,
        int? provinceId,
        int? categoryId,
        int page = 1,
        int pageSize = 10,
        CancellationToken ct = default)
    {
        var safePage = Math.Max(1, page);
        var safePageSize = Math.Clamp(pageSize, 1, 50);
        var connection = _dbContext.Database.GetDbConnection();

        var isProvinceType = string.Equals(type, "province", StringComparison.OrdinalIgnoreCase)
            || string.Equals(type, "provinces", StringComparison.OrdinalIgnoreCase)
            || string.Equals(type, "destinations", StringComparison.OrdinalIgnoreCase);

        var isPlaceAllType = string.Equals(type, "place", StringComparison.OrdinalIgnoreCase)
            || string.Equals(type, "places", StringComparison.OrdinalIgnoreCase);

        const string settingsSql = "SELECT SettingKey, SettingValue FROM dbo.SystemSettings WHERE SettingGroup = 'RANKING';";
        var settingsRows = await connection.QueryAsync<(string SettingKey, string? SettingValue)>(
            new CommandDefinition(settingsSql, cancellationToken: ct));
        var settingsDict = settingsRows.ToDictionary(x => x.SettingKey, x => x.SettingValue, StringComparer.OrdinalIgnoreCase);
        string? rankingBadge = settingsDict.GetValueOrDefault("RANKING_BADGE");

        var header = new RankingDetailHeaderDto
        {
            Badge = rankingBadge
        };

        if (isProvinceType)
        {
            if (provinceId.HasValue)
            {
                const string pSql = "SELECT Name, Tagline, Description, ImageUrl FROM dbo.Provinces WHERE Id = @Id AND Status = 1;";
                var prov = await connection.QueryFirstOrDefaultAsync(new CommandDefinition(pSql, new { Id = provinceId.Value }, cancellationToken: ct));
                if (prov != null)
                {
                    header.Title = (string)prov.Name;
                    header.Subtitle = (string?)prov.Description ?? (string?)prov.Tagline;
                    header.CoverImageUrl = (string?)prov.ImageUrl;
                    header.TargetName = (string)prov.Name;
                }
            }
            else
            {
                header.Title = settingsDict.GetValueOrDefault("RANKING_DESTINATIONS_TITLE") ?? settingsDict.GetValueOrDefault("RANKING_DESTINATIONS_VN_TITLE");
                header.Subtitle = settingsDict.GetValueOrDefault("RANKING_DESTINATIONS_TAGLINE");
                header.CoverImageUrl = settingsDict.GetValueOrDefault("RANKING_DESTINATIONS_COVER");
                header.TargetName = settingsDict.GetValueOrDefault("RANKING_DESTINATIONS_VN_TITLE");
            }
        }
        else if (isPlaceAllType)
        {
            header.Title = settingsDict.GetValueOrDefault("RANKING_PLACES_TITLE") ?? settingsDict.GetValueOrDefault("RANKING_PLACES_VN_TITLE");
            header.Subtitle = settingsDict.GetValueOrDefault("RANKING_PLACES_TAGLINE");
            header.CoverImageUrl = settingsDict.GetValueOrDefault("RANKING_PLACES_COVER");
            header.TargetName = settingsDict.GetValueOrDefault("RANKING_PLACES_VN_TITLE");
        }
        else
        {
            int activePtId = placeTypeId ?? 1;
            const string ptSql = "SELECT Id, Name, Slug, EnglishName, Tagline, Description, ImageUrl FROM dbo.PlaceTypes WHERE Id = @Id AND Status = 1;";
            var pt = await connection.QueryFirstOrDefaultAsync(new CommandDefinition(ptSql, new { Id = activePtId }, cancellationToken: ct));

            if (pt != null)
            {
                header.Title = (string?)pt.EnglishName ?? (string)pt.Name;
                header.Subtitle = (string?)pt.Description ?? (string?)pt.Tagline;
                header.CoverImageUrl = (string?)pt.ImageUrl;
                header.TargetName = (string)pt.Name;
            }
        }

        string subCatSql = (isProvinceType && provinceId.HasValue)
            ? @"SELECT DISTINCT c.Id, c.Name, c.Slug AS Code, c.Slug, COUNT(pl.Id) AS PlaceCount
                FROM dbo.Places pl
                INNER JOIN dbo.Categories c ON pl.CategoryId = c.Id
                WHERE pl.ProvinceId = @ProvinceId AND pl.Status = 1 AND pl.IsDeleted = 0
                GROUP BY c.Id, c.Name, c.Slug
                ORDER BY PlaceCount DESC;"
            : @"SELECT c.Id, c.Name, c.Slug AS Code, c.Slug, (SELECT COUNT(1) FROM dbo.Places pl WHERE pl.CategoryId = c.Id AND pl.Status = 1 AND pl.IsDeleted = 0) AS PlaceCount
                FROM dbo.Categories c
                WHERE (@PlaceTypeId IS NULL OR c.PlaceTypeId = @PlaceTypeId) AND c.Status = 1
                ORDER BY c.DisplayOrder, c.Name;";

        var subCats = (await connection.QueryAsync<RankingSubCategoryDto>(
            new CommandDefinition(subCatSql, new { PlaceTypeId = isPlaceAllType || isProvinceType ? null : placeTypeId, ProvinceId = provinceId }, cancellationToken: ct))).ToList();

        const string provListSql = @"
            SELECT p.Id, p.Name, p.RegionId, r.Name AS RegionName
            FROM dbo.Provinces p
            INNER JOIN dbo.Regions r ON p.RegionId = r.Id
            WHERE p.Status = 1
            ORDER BY p.DisplayOrder, p.Name;";

        var availableProvinces = (await connection.QueryAsync<RankingProvinceOptionDto>(
            new CommandDefinition(provListSql, cancellationToken: ct))).ToList();

        int offset = (safePage - 1) * safePageSize;

        if (isProvinceType && !provinceId.HasValue)
        {
            const string provCountSql = @"
                SELECT COUNT(1)
                FROM dbo.Provinces prov
                WHERE prov.Status = 1
                  AND (@CategoryId IS NULL OR EXISTS (SELECT 1 FROM dbo.Places pl WHERE pl.ProvinceId = prov.Id AND pl.CategoryId = @CategoryId AND pl.Status = 1 AND pl.IsDeleted = 0));";

            var totalProvincesCount = await connection.ExecuteScalarAsync<int>(
                new CommandDefinition(provCountSql, new { CategoryId = categoryId }, cancellationToken: ct));

            const string provRankSql = @"
                SELECT
                    prov.Id,
                    prov.Name,
                    prov.Slug,
                    prov.Tagline,
                    prov.Description,
                    prov.ImageUrl,
                    prov.RegionId,
                    r.Name AS RegionName,
                    COUNT(p.Id) AS TotalPlaces,
                    ISNULL(SUM(p.ReviewCount), 0) AS TotalReviews,
                    CAST(ISNULL(AVG(CAST(p.AvgRating AS FLOAT)), 0.0) AS DECIMAL(3, 2)) AS AvgRating,
                    ROUND(
                        (
                            (ISNULL(AVG(CAST(p.AvgRating AS FLOAT)), 0.0) * 20.0)
                            + (LOG(CAST(ISNULL(SUM(p.ReviewCount), 0) + 1 AS FLOAT)) * 15.0)
                            + (LOG(CAST(ISNULL(SUM(p.ViewCount), 0) + 1 AS FLOAT)) * 10.0)
                            + (COUNT(CASE WHEN p.AvgRating >= 4.0 THEN 1 END) * 2.0)
                        ), 2
                    ) AS Score
                FROM dbo.Provinces prov
                INNER JOIN dbo.Regions r ON prov.RegionId = r.Id
                LEFT JOIN dbo.Places p ON p.ProvinceId = prov.Id AND p.Status = 1 AND p.IsDeleted = 0
                WHERE prov.Status = 1
                  AND (@CategoryId IS NULL OR EXISTS (SELECT 1 FROM dbo.Places pl WHERE pl.ProvinceId = prov.Id AND pl.CategoryId = @CategoryId AND pl.Status = 1 AND pl.IsDeleted = 0))
                GROUP BY prov.Id, prov.Name, prov.Slug, prov.Tagline, prov.Description, prov.ImageUrl, prov.RegionId, r.Name
                ORDER BY Score DESC, TotalReviews DESC
                OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;";

            var provinceItems = (await connection.QueryAsync<DestinationRankingItemDto>(
                new CommandDefinition(provRankSql, new { Offset = offset, PageSize = safePageSize, CategoryId = categoryId }, cancellationToken: ct))).ToList();

            for (int i = 0; i < provinceItems.Count; i++)
            {
                int currentRank = offset + i + 1;
                provinceItems[i].Rank = currentRank;
                provinceItems[i].Badge = currentRank switch
                {
                    1 => "TOP 1",
                    2 => "TOP 2",
                    3 => "TOP 3",
                    _ => null
                };
            }

            foreach (var dest in provinceItems)
            {
                var placesList = await GetPlaceRankingsAsync(provinceId: dest.Id, limit: 3, ct: ct);
                dest.AwardWinningPlaces = placesList.ToList();

                const string tagsSql = @"
                    SELECT DISTINCT TOP 5 c.Name
                    FROM dbo.Places pl
                    INNER JOIN dbo.Categories c ON pl.CategoryId = c.Id
                    WHERE pl.ProvinceId = @ProvinceId AND pl.Status = 1 AND pl.IsDeleted = 0;";
                var tags = await connection.QueryAsync<string>(new CommandDefinition(tagsSql, new { ProvinceId = dest.Id }, cancellationToken: ct));
                dest.GreatThingsToDo = tags.ToList();

                var rawName = dest.Name.Replace("TP ", "").Replace("Tỉnh ", "").Trim();
                const string blogSql = @"
                    SELECT TOP 1
                        b.Id, b.Title, b.Slug, b.CoverImageUrl, b.Excerpt, b.ReadTimeMinutes
                    FROM dbo.Blogs b
                    WHERE b.Status = 1
                      AND (b.Title LIKE @SearchPattern OR b.Excerpt LIKE @SearchPattern)
                    ORDER BY b.ViewCount DESC, b.CreatedAt DESC;";
                var story = await connection.QueryFirstOrDefaultAsync<DestinationFeaturedStoryDto>(
                    new CommandDefinition(blogSql, new { SearchPattern = $"%{rawName}%" }, cancellationToken: ct));

                dest.FeaturedStory = story;
            }

            return new RankingDetailViewDto
            {
                Header = header,
                SubCategories = subCats,
                AvailableProvinces = availableProvinces,
                ProvinceItems = provinceItems,
                Items = [],
                Page = safePage,
                PageSize = safePageSize,
                TotalCount = totalProvincesCount
            };
        }

        int? effectivePlaceTypeId = isPlaceAllType || isProvinceType ? null : (placeTypeId ?? 1);

        const string countSql = @"
            SELECT COUNT(1)
            FROM dbo.Places p
            INNER JOIN dbo.Categories cat ON p.CategoryId = cat.Id
            WHERE p.Status = 1 AND p.IsDeleted = 0
              AND (@PlaceTypeId IS NULL OR cat.PlaceTypeId = @PlaceTypeId)
              AND (@CategoryId IS NULL OR p.CategoryId = @CategoryId)
              AND (@ProvinceId IS NULL OR p.ProvinceId = @ProvinceId);";

        var totalPlacesCountResult = await connection.ExecuteScalarAsync<int>(new CommandDefinition(countSql, new
        {
            PlaceTypeId = effectivePlaceTypeId,
            CategoryId = categoryId,
            ProvinceId = provinceId
        }, cancellationToken: ct));

        const string placesSql = @"
            SELECT
                p.Id,
                p.Name,
                p.Description,
                p.Address,
                p.ProvinceId,
                prov.Name AS ProvinceName,
                p.CategoryId,
                cat.Name AS CategoryName,
                cat.PlaceTypeId,
                pt.Name AS PlaceTypeName,
                COALESCE(NULLIF(p.CoverImageUrl, ''), (SELECT TOP 1 pm.Url FROM dbo.PlaceMedia pm WHERE pm.PlaceId = p.Id ORDER BY pm.DisplayOrder)) AS CoverImageUrl,
                p.AvgRating,
                p.ReviewCount,
                p.ViewCount,
                (SELECT COUNT(1) FROM dbo.Favorites f WHERE f.TargetId = p.Id AND f.TargetType = 1) AS FavoritesCount,
                ROUND(
                    (
                        ((CAST(p.ReviewCount AS FLOAT) / (CAST(p.ReviewCount AS FLOAT) + 5.0)) * CAST(p.AvgRating AS FLOAT)
                         + (5.0 / (CAST(p.ReviewCount AS FLOAT) + 5.0)) * 4.2) * 20.0
                        + (LOG(CAST(p.ReviewCount + 1 AS FLOAT)) * 10.0)
                        + (LOG(CAST(p.ViewCount + 1 AS FLOAT)) * 5.0)
                        + (SQRT(CAST((SELECT COUNT(1) FROM dbo.Favorites f WHERE f.TargetId = p.Id AND f.TargetType = 1) AS FLOAT)) * 4.0)
                        + (SQRT(CAST((SELECT COUNT(1) FROM dbo.TripPlaces tp WHERE tp.PlaceId = p.Id) AS FLOAT)) * 5.0)
                    ), 2
                ) AS Score
            FROM dbo.Places p
            INNER JOIN dbo.Provinces prov ON p.ProvinceId = prov.Id
            INNER JOIN dbo.Categories cat ON p.CategoryId = cat.Id
            INNER JOIN dbo.PlaceTypes pt ON cat.PlaceTypeId = pt.Id
            WHERE p.Status = 1 AND p.IsDeleted = 0
              AND (@PlaceTypeId IS NULL OR cat.PlaceTypeId = @PlaceTypeId)
              AND (@CategoryId IS NULL OR p.CategoryId = @CategoryId)
              AND (@ProvinceId IS NULL OR p.ProvinceId = @ProvinceId)
            ORDER BY Score DESC, p.AvgRating DESC, p.ReviewCount DESC
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;";

        var places = (await connection.QueryAsync<RankingPlaceItemDto>(new CommandDefinition(placesSql, new
        {
            PlaceTypeId = effectivePlaceTypeId,
            CategoryId = categoryId,
            ProvinceId = provinceId,
            Offset = offset,
            PageSize = safePageSize
        }, cancellationToken: ct))).ToList();

        for (int i = 0; i < places.Count; i++)
        {
            int currentRank = offset + i + 1;
            places[i].Rank = currentRank;
            places[i].Badge = currentRank switch
            {
                1 => "TOP 1",
                2 => "TOP 2",
                3 => "TOP 3",
                _ => null
            };

            const string reviewSql = @"
                SELECT TOP 1
                    r.Id AS ReviewId,
                    COALESCE(prof.FullName, u.Email, N'Du khách ẩn danh') AS AuthorName,
                    prof.AvatarUrl AS AuthorAvatar,
                    CAST(r.Rating AS DECIMAL(3, 1)) AS Rating,
                    r.Content,
                    ISNULL(r.LikesCount, 0) AS LikesCount,
                    r.CreatedAt
                FROM dbo.Reviews r
                LEFT JOIN dbo.Users u ON r.UserId = u.Id
                LEFT JOIN dbo.UserProfiles prof ON u.Id = prof.UserId
                WHERE r.PlaceId = @PlaceId AND r.Status = 1 AND LEN(r.Content) > 10
                ORDER BY ISNULL(r.LikesCount, 0) DESC, r.Rating DESC, r.CreatedAt DESC;";

            var snippet = await connection.QueryFirstOrDefaultAsync<RankingReviewSnippetDto>(
                new CommandDefinition(reviewSql, new { PlaceId = places[i].Id }, cancellationToken: ct));

            places[i].FeaturedReview = snippet;
        }

        return new RankingDetailViewDto
        {
            Header = header,
            SubCategories = subCats,
            AvailableProvinces = availableProvinces,
            ProvinceItems = [],
            Items = places,
            Page = safePage,
            PageSize = safePageSize,
            TotalCount = totalPlacesCountResult
        };
    }

    public async Task<IReadOnlyList<PlaceRankingItemDto>> GetPlaceRankingsAsync(
        int? placeTypeId = null,
        int? categoryId = null,
        int? provinceId = null,
        int? regionId = null,
        string period = "all_time",
        int limit = 10,
        CancellationToken ct = default)
    {
        var safeLimit = Math.Clamp(limit, 1, 50);
        var connection = _dbContext.Database.GetDbConnection();

        const string sql = @"
            SELECT TOP (@Limit)
                p.Id,
                p.Name,
                p.Address,
                p.ProvinceId,
                prov.Name AS ProvinceName,
                p.CategoryId,
                cat.Name AS CategoryName,
                cat.PlaceTypeId,
                pt.Name AS PlaceTypeName,
                p.AvgRating,
                p.ReviewCount,
                p.ViewCount,
                (SELECT COUNT(1) FROM dbo.Favorites f WHERE f.TargetId = p.Id AND f.TargetType = 1) AS FavoritesCount,
                COALESCE(NULLIF(p.CoverImageUrl, ''), (SELECT TOP 1 pm.Url FROM dbo.PlaceMedia pm WHERE pm.PlaceId = p.Id ORDER BY pm.DisplayOrder)) AS ThumbnailUrl,
                ROUND(
                    (
                        ((CAST(p.ReviewCount AS FLOAT) / (CAST(p.ReviewCount AS FLOAT) + 5.0)) * CAST(p.AvgRating AS FLOAT)
                         + (5.0 / (CAST(p.ReviewCount AS FLOAT) + 5.0)) * 4.2) * 20.0
                        + (LOG(CAST(p.ReviewCount + 1 AS FLOAT)) * 10.0)
                        + (LOG(CAST(p.ViewCount + 1 AS FLOAT)) * 5.0)
                        + (SQRT(CAST((SELECT COUNT(1) FROM dbo.Favorites f WHERE f.TargetId = p.Id AND f.TargetType = 1) AS FLOAT)) * 4.0)
                        + (SQRT(CAST((SELECT COUNT(1) FROM dbo.TripPlaces tp WHERE tp.PlaceId = p.Id) AS FLOAT)) * 5.0)
                    ), 2
                ) AS Score
            FROM dbo.Places p
            INNER JOIN dbo.Provinces prov ON p.ProvinceId = prov.Id
            INNER JOIN dbo.Categories cat ON p.CategoryId = cat.Id
            INNER JOIN dbo.PlaceTypes pt ON cat.PlaceTypeId = pt.Id
            WHERE p.Status = 1 AND p.IsDeleted = 0
              AND (@PlaceTypeId IS NULL OR cat.PlaceTypeId = @PlaceTypeId)
              AND (@CategoryId IS NULL OR p.CategoryId = @CategoryId)
              AND (@ProvinceId IS NULL OR p.ProvinceId = @ProvinceId)
              AND (@RegionId IS NULL OR prov.RegionId = @RegionId)
            ORDER BY Score DESC, p.AvgRating DESC, p.ReviewCount DESC;";

        var command = new CommandDefinition(sql, new
        {
            Limit = safeLimit,
            PlaceTypeId = placeTypeId,
            CategoryId = categoryId,
            ProvinceId = provinceId,
            RegionId = regionId
        }, cancellationToken: ct);

        var list = (await connection.QueryAsync<PlaceRankingItemDto>(command)).ToList();

        for (int i = 0; i < list.Count; i++)
        {
            list[i].Rank = i + 1;
            list[i].Badge = i switch
            {
                0 => "TOP 1",
                1 => "TOP 2",
                2 => "TOP 3",
                _ => null
            };
        }

        return list;
    }

    public async Task<IReadOnlyList<ProvinceRankingItemDto>> GetProvinceRankingsAsync(
        int? regionId = null,
        int limit = 10,
        CancellationToken ct = default)
    {
        var safeLimit = Math.Clamp(limit, 1, 50);
        var connection = _dbContext.Database.GetDbConnection();

        const string sql = @"
            SELECT TOP (@Limit)
                prov.Id,
                prov.Name,
                prov.Slug,
                prov.Tagline,
                prov.ImageUrl,
                prov.RegionId,
                r.Name AS RegionName,
                COUNT(p.Id) AS TotalPlaces,
                ISNULL(SUM(p.ReviewCount), 0) AS TotalReviews,
                CAST(ISNULL(AVG(CAST(p.AvgRating AS FLOAT)), 0.0) AS DECIMAL(3, 2)) AS AvgRating,
                ROUND(
                    (
                        (ISNULL(AVG(CAST(p.AvgRating AS FLOAT)), 0.0) * 20.0)
                        + (LOG(CAST(ISNULL(SUM(p.ReviewCount), 0) + 1 AS FLOAT)) * 15.0)
                        + (LOG(CAST(ISNULL(SUM(p.ViewCount), 0) + 1 AS FLOAT)) * 10.0)
                        + (COUNT(CASE WHEN p.AvgRating >= 4.0 THEN 1 END) * 2.0)
                    ), 2
                ) AS Score
            FROM dbo.Provinces prov
            INNER JOIN dbo.Regions r ON prov.RegionId = r.Id
            LEFT JOIN dbo.Places p ON p.ProvinceId = prov.Id AND p.Status = 1 AND p.IsDeleted = 0
            WHERE prov.Status = 1
              AND (@RegionId IS NULL OR prov.RegionId = @RegionId)
            GROUP BY prov.Id, prov.Name, prov.Slug, prov.Tagline, prov.ImageUrl, prov.RegionId, r.Name
            HAVING COUNT(p.Id) > 0
            ORDER BY Score DESC, TotalReviews DESC;";

        var command = new CommandDefinition(sql, new
        {
            Limit = safeLimit,
            RegionId = regionId
        }, cancellationToken: ct);

        var list = (await connection.QueryAsync<ProvinceRankingItemDto>(command)).ToList();

        for (int i = 0; i < list.Count; i++)
        {
            list[i].Rank = i + 1;
            list[i].Badge = i switch
            {
                0 => "TOP 1",
                1 => "TOP 2",
                2 => "TOP 3",
                _ => null
            };
        }

        return list;
    }

    public async Task<IReadOnlyList<DestinationRankingItemDto>> GetDestinationRankingsAsync(
        int? regionId = null,
        int? categoryId = null,
        int limit = 10,
        CancellationToken ct = default)
    {
        var safeLimit = Math.Clamp(limit, 1, 25);
        var connection = _dbContext.Database.GetDbConnection();

        const string sql = @"
            SELECT TOP (@Limit)
                prov.Id,
                prov.Name,
                prov.Slug,
                prov.Tagline,
                prov.Description,
                prov.ImageUrl,
                prov.RegionId,
                r.Name AS RegionName,
                COUNT(p.Id) AS TotalPlaces,
                ISNULL(SUM(p.ReviewCount), 0) AS TotalReviews,
                CAST(ISNULL(AVG(CAST(p.AvgRating AS FLOAT)), 0.0) AS DECIMAL(3, 2)) AS AvgRating,
                ROUND(
                    (
                        (ISNULL(AVG(CAST(p.AvgRating AS FLOAT)), 0.0) * 20.0)
                        + (LOG(CAST(ISNULL(SUM(p.ReviewCount), 0) + 1 AS FLOAT)) * 15.0)
                        + (LOG(CAST(ISNULL(SUM(p.ViewCount), 0) + 1 AS FLOAT)) * 10.0)
                        + (COUNT(CASE WHEN p.AvgRating >= 4.0 THEN 1 END) * 2.0)
                    ), 2
                ) AS Score
            FROM dbo.Provinces prov
            INNER JOIN dbo.Regions r ON prov.RegionId = r.Id
            LEFT JOIN dbo.Places p ON p.ProvinceId = prov.Id AND p.Status = 1 AND p.IsDeleted = 0
            WHERE prov.Status = 1
              AND (@RegionId IS NULL OR prov.RegionId = @RegionId)
              AND (@CategoryId IS NULL OR EXISTS (SELECT 1 FROM dbo.Places pl WHERE pl.ProvinceId = prov.Id AND pl.CategoryId = @CategoryId AND pl.Status = 1))
            GROUP BY prov.Id, prov.Name, prov.Slug, prov.Tagline, prov.Description, prov.ImageUrl, prov.RegionId, r.Name
            HAVING COUNT(p.Id) > 0
            ORDER BY Score DESC, TotalReviews DESC;";

        var command = new CommandDefinition(sql, new
        {
            Limit = safeLimit,
            RegionId = regionId,
            CategoryId = categoryId
        }, cancellationToken: ct);

        var destinations = (await connection.QueryAsync<DestinationRankingItemDto>(command)).ToList();

        for (int i = 0; i < destinations.Count; i++)
        {
            destinations[i].Rank = i + 1;
            destinations[i].Badge = i switch
            {
                0 => "TOP 1",
                1 => "TOP 2",
                2 => "TOP 3",
                _ => null
            };
        }

        foreach (var dest in destinations)
        {
            var places = await GetPlaceRankingsAsync(provinceId: dest.Id, limit: 3, ct: ct);
            dest.AwardWinningPlaces = places.ToList();

            const string tagsSql = @"
                SELECT DISTINCT TOP 5 c.Name
                FROM dbo.Places pl
                INNER JOIN dbo.Categories c ON pl.CategoryId = c.Id
                WHERE pl.ProvinceId = @ProvinceId AND pl.Status = 1 AND pl.IsDeleted = 0;";
            var tags = await connection.QueryAsync<string>(new CommandDefinition(tagsSql, new { ProvinceId = dest.Id }, cancellationToken: ct));
            dest.GreatThingsToDo = tags.ToList();

            var rawName = dest.Name.Replace("TP ", "").Replace("Tỉnh ", "").Trim();
            const string blogSql = @"
                SELECT TOP 1
                    b.Id, b.Title, b.Slug, b.CoverImageUrl, b.Excerpt, b.ReadTimeMinutes
                FROM dbo.Blogs b
                WHERE b.Status = 1
                  AND (b.Title LIKE @SearchPattern OR b.Excerpt LIKE @SearchPattern)
                ORDER BY b.ViewCount DESC, b.CreatedAt DESC;";
            var story = await connection.QueryFirstOrDefaultAsync<DestinationFeaturedStoryDto>(
                new CommandDefinition(blogSql, new { SearchPattern = $"%{rawName}%" }, cancellationToken: ct));

            dest.FeaturedStory = story;
        }

        return destinations;
    }
}
