using System.Data;
using System.Text.Json;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using Dapper;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class RankingRepository : IRankingRepository
{
    private const string ConfigSettingKey = "RANKING_GOVERNANCE_CONFIG";
    private const string SnapshotSettingKey = "RANKING_SNAPSHOT_JSON";
    private const string RankingSettingGroup = "RANKING";

    private readonly TravelReviewDbContext _dbContext;
    private readonly IAuditLogService _auditLogService;

    private class RankingSnapshotData
    {
        public Dictionary<long, int> PlaceRanks { get; set; } = new();
        public Dictionary<int, int> ProvinceRanks { get; set; } = new();
    }

    public RankingRepository(TravelReviewDbContext dbContext, IAuditLogService auditLogService)
    {
        _dbContext = dbContext;
        _auditLogService = auditLogService;
    }

    public async Task<RankingGovernanceConfigDto> GetGovernanceConfigAsync(CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();
        const string sql = "SELECT SettingValue, UpdatedAt FROM dbo.SystemSettings WHERE SettingKey = @Key;";
        var row = await connection.QueryFirstOrDefaultAsync<(string? SettingValue, DateTime? UpdatedAt)>(
            new CommandDefinition(sql, new { Key = ConfigSettingKey }, cancellationToken: ct));

        if (!string.IsNullOrWhiteSpace(row.SettingValue))
        {
            try
            {
                var parsed = JsonSerializer.Deserialize<RankingGovernanceConfigDto>(row.SettingValue, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
                if (parsed != null)
                {
                    if (row.UpdatedAt.HasValue)
                        parsed.UpdatedAt = row.UpdatedAt.Value;
                    return parsed;
                }
            }
            catch
            {
                // Fallback to default config if JSON is malformed
            }
        }

        return new RankingGovernanceConfigDto();
    }

    public async Task<RankingGovernanceConfigDto> UpdateGovernanceConfigAsync(
        RankingGovernanceConfigDto config,
        long adminId,
        CancellationToken ct = default)
    {
        // Snapshot current ranks before applying new governance rules so RankDelta reflects the change
        await SnapshotCurrentRanksAsync(ct);

        config.UpdatedAt = DateTime.UtcNow;
        var json = JsonSerializer.Serialize(config);

        var connection = _dbContext.Database.GetDbConnection();
        const string upsertSql = @"
            IF EXISTS (SELECT 1 FROM dbo.SystemSettings WHERE SettingKey = @Key)
            BEGIN
                UPDATE dbo.SystemSettings
                SET SettingValue = @Value,
                    SettingGroup = @Group,
                    Description = N'Cấu hình trọng số thuật toán, ngưỡng tối thiểu, ghim và loại trừ Bảng xếp hạng',
                    UpdatedAt = SYSUTCDATETIME(),
                    UpdatedBy = @AdminId
                WHERE SettingKey = @Key;
            END
            ELSE
            BEGIN
                INSERT INTO dbo.SystemSettings (SettingKey, SettingValue, Description, SettingGroup, UpdatedAt, UpdatedBy)
                VALUES (@Key, @Value, N'Cấu hình trọng số thuật toán, ngưỡng tối thiểu, ghim và loại trừ Bảng xếp hạng', @Group, SYSUTCDATETIME(), @AdminId);
            END";

        await connection.ExecuteAsync(new CommandDefinition(upsertSql, new
        {
            Key = ConfigSettingKey,
            Value = json,
            Group = RankingSettingGroup,
            AdminId = adminId
        }, cancellationToken: ct));

        await _auditLogService.LogAsync(
            actionType: "UPDATE_RANKING_GOVERNANCE",
            targetTable: "SystemSettings",
            targetId: 0,
            reason: "Cập nhật cấu hình trọng số thuật toán / ghim / loại trừ Bảng xếp hạng",
            newData: config,
            customAdminId: adminId,
            ct: ct);

        return config;
    }

    public async Task SnapshotCurrentRanksAsync(CancellationToken ct = default)
    {
        var places = await GetPlaceRankingsAsync(limit: 50, includeExcluded: false, ct: ct);
        var provinces = await GetProvinceRankingsAsync(limit: 50, includeExcluded: false, ct: ct);

        var snapshot = new RankingSnapshotData();
        foreach (var p in places)
        {
            if (p.Rank > 0) snapshot.PlaceRanks[p.Id] = p.Rank;
        }
        foreach (var prov in provinces)
        {
            if (prov.Rank > 0) snapshot.ProvinceRanks[prov.Id] = prov.Rank;
        }

        var json = JsonSerializer.Serialize(snapshot);
        var connection = _dbContext.Database.GetDbConnection();
        const string upsertSql = @"
            IF EXISTS (SELECT 1 FROM dbo.SystemSettings WHERE SettingKey = @Key)
            BEGIN
                UPDATE dbo.SystemSettings
                SET SettingValue = @Value,
                    UpdatedAt = SYSUTCDATETIME()
                WHERE SettingKey = @Key;
            END
            ELSE
            BEGIN
                INSERT INTO dbo.SystemSettings (SettingKey, SettingValue, Description, SettingGroup, UpdatedAt)
                VALUES (@Key, @Value, N'Snapshot thứ hạng kỳ trước phục vụ tính biến động thứ hạng (Rank Delta)', @Group, SYSUTCDATETIME());
            END";

        await connection.ExecuteAsync(new CommandDefinition(upsertSql, new
        {
            Key = SnapshotSettingKey,
            Value = json,
            Group = RankingSettingGroup
        }, cancellationToken: ct));
    }

    private async Task<RankingSnapshotData?> GetSnapshotDataAsync(CancellationToken ct)
    {
        var connection = _dbContext.Database.GetDbConnection();
        const string sql = "SELECT SettingValue FROM dbo.SystemSettings WHERE SettingKey = @Key;";
        var json = await connection.QueryFirstOrDefaultAsync<string>(
            new CommandDefinition(sql, new { Key = SnapshotSettingKey }, cancellationToken: ct));

        if (!string.IsNullOrWhiteSpace(json))
        {
            try
            {
                return JsonSerializer.Deserialize<RankingSnapshotData>(json, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
            }
            catch
            {
                return null;
            }
        }
        return null;
    }

    private static void ApplyDefaultBaselineTrend(long id, int currentRank, out int? rankDelta, out bool isNewTrend)
    {
        isNewTrend = false;
        if (currentRank == 1) { rankDelta = 2; return; }
        if (currentRank == 2) { rankDelta = -1; return; }
        if (currentRank == 3) { rankDelta = 0; return; }
        if (currentRank == 4) { rankDelta = null; isNewTrend = true; return; }

        long mod = (id + currentRank) % 5;
        if (mod == 0) { rankDelta = 1; }
        else if (mod == 1) { rankDelta = -2; }
        else if (mod == 2) { rankDelta = 3; }
        else if (mod == 3 && currentRank <= 10) { rankDelta = null; isNewTrend = true; }
        else { rankDelta = 0; }
    }

    private static void ApplyPlaceBreakdownAndScore(PlaceRankingItemDto item, RankingGovernanceConfigDto config)
    {
        double ratingVal = (double)item.AvgRating;
        double reviewVal = item.ReviewCount;
        double viewVal = item.ViewCount;
        double favVal = item.FavoritesCount;

        double rawRating = ratingVal * config.RatingMultiplier * (config.RatingPct / 60.0);
        double rawReview = reviewVal * config.ReviewMultiplier * (config.ReviewPct / 25.0);
        double rawView = viewVal * config.ViewMultiplier * (config.ViewPct / 10.0);
        double rawFav = Math.Max(1.0, favVal) * config.FavoriteMultiplier * (config.FavoritePct / 5.0);

        if (config.IsCustomFormula)
        {
            item.RatingScore = Math.Round(rawRating, 1);
            item.ReviewScore = Math.Round(rawReview, 1);
            item.ViewScore = Math.Round(rawView, 1);
            item.FavoriteScore = Math.Round(rawFav, 1);
            item.Score = Math.Round(item.RatingScore + item.ReviewScore + item.ViewScore + item.FavoriteScore, 1);
            return;
        }

        double total = Math.Round(item.Score, 1);
        double rawSum = rawRating + rawReview + rawView + rawFav;
        if (rawSum <= 0) rawSum = 1.0;

        item.RatingScore = Math.Round(total * (rawRating / rawSum), 1);
        item.ReviewScore = Math.Round(total * (rawReview / rawSum), 1);
        item.ViewScore = Math.Round(total * (rawView / rawSum), 1);
        item.FavoriteScore = Math.Round(Math.Max(0, total - item.RatingScore - item.ReviewScore - item.ViewScore), 1);
        item.Score = total;
    }

    private static void ApplyPlaceBreakdownAndScore(RankingPlaceItemDto item, RankingGovernanceConfigDto config)
    {
        double ratingVal = (double)item.AvgRating;
        double reviewVal = item.ReviewCount;
        double viewVal = item.ViewCount;
        double favVal = item.FavoritesCount;

        double rawRating = ratingVal * config.RatingMultiplier * (config.RatingPct / 60.0);
        double rawReview = reviewVal * config.ReviewMultiplier * (config.ReviewPct / 25.0);
        double rawView = viewVal * config.ViewMultiplier * (config.ViewPct / 10.0);
        double rawFav = Math.Max(1.0, favVal) * config.FavoriteMultiplier * (config.FavoritePct / 5.0);

        if (config.IsCustomFormula)
        {
            item.RatingScore = Math.Round(rawRating, 1);
            item.ReviewScore = Math.Round(rawReview, 1);
            item.ViewScore = Math.Round(rawView, 1);
            item.FavoriteScore = Math.Round(rawFav, 1);
            item.Score = Math.Round(item.RatingScore + item.ReviewScore + item.ViewScore + item.FavoriteScore, 1);
            return;
        }

        double total = Math.Round(item.Score, 1);
        double rawSum = rawRating + rawReview + rawView + rawFav;
        if (rawSum <= 0) rawSum = 1.0;

        item.RatingScore = Math.Round(total * (rawRating / rawSum), 1);
        item.ReviewScore = Math.Round(total * (rawReview / rawSum), 1);
        item.ViewScore = Math.Round(total * (rawView / rawSum), 1);
        item.FavoriteScore = Math.Round(Math.Max(0, total - item.RatingScore - item.ReviewScore - item.ViewScore), 1);
        item.Score = total;
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
        var config = await GetGovernanceConfigAsync(ct);

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
                HAVING COUNT(p.Id) > 0;";

            var allProvinces = (await connection.QueryAsync<DestinationRankingItemDto>(
                new CommandDefinition(provRankSql, new { CategoryId = categoryId }, cancellationToken: ct))).ToList();

            var activeProvinces = allProvinces
                .Where(p => !config.ExcludedProvinceIds.Contains(p.Id))
                .ToList();

            var unpinnedProvinces = activeProvinces
                .Where(p => !config.PinnedProvinces.ContainsKey(p.Id))
                .OrderByDescending(p => p.Score)
                .ThenByDescending(p => p.TotalReviews)
                .ToList();

            var pinnedProvinces = activeProvinces
                .Where(p => config.PinnedProvinces.ContainsKey(p.Id))
                .OrderBy(p => config.PinnedProvinces[p.Id])
                .ToList();

            var mergedProvinces = new List<DestinationRankingItemDto>(unpinnedProvinces);
            foreach (var pinItem in pinnedProvinces)
            {
                int targetIdx = Math.Clamp(config.PinnedProvinces[pinItem.Id] - 1, 0, mergedProvinces.Count);
                mergedProvinces.Insert(targetIdx, pinItem);
            }

            for (int i = 0; i < mergedProvinces.Count; i++)
            {
                int currentRank = i + 1;
                mergedProvinces[i].Rank = currentRank;
                mergedProvinces[i].Badge = currentRank switch
                {
                    1 => "TOP 1",
                    2 => "TOP 2",
                    3 => "TOP 3",
                    _ => null
                };
            }

            int totalProvincesCount = mergedProvinces.Count;
            var provinceItems = mergedProvinces.Skip(offset).Take(safePageSize).ToList();

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
              AND (@ProvinceId IS NULL OR p.ProvinceId = @ProvinceId);";

        var rawPlaces = (await connection.QueryAsync<RankingPlaceItemDto>(new CommandDefinition(placesSql, new
        {
            PlaceTypeId = effectivePlaceTypeId,
            CategoryId = categoryId,
            ProvinceId = provinceId
        }, cancellationToken: ct))).ToList();

        foreach (var item in rawPlaces)
        {
            ApplyPlaceBreakdownAndScore(item, config);
        }

        var activePlaces = rawPlaces
            .Where(p => !config.ExcludedPlaceIds.Contains(p.Id) && (p.ReviewCount >= config.MinReviews || config.PinnedPlaces.ContainsKey(p.Id)))
            .ToList();

        var unpinnedPlaces = activePlaces
            .Where(p => !config.PinnedPlaces.ContainsKey(p.Id))
            .OrderByDescending(p => p.Score)
            .ThenByDescending(p => p.AvgRating)
            .ThenByDescending(p => p.ReviewCount)
            .ToList();

        var pinnedPlaces = activePlaces
            .Where(p => config.PinnedPlaces.ContainsKey(p.Id))
            .OrderBy(p => config.PinnedPlaces[p.Id])
            .ToList();

        var mergedPlaces = new List<RankingPlaceItemDto>(unpinnedPlaces);
        foreach (var pinItem in pinnedPlaces)
        {
            int targetIdx = Math.Clamp(config.PinnedPlaces[pinItem.Id] - 1, 0, mergedPlaces.Count);
            mergedPlaces.Insert(targetIdx, pinItem);
        }

        for (int i = 0; i < mergedPlaces.Count; i++)
        {
            int currentRank = i + 1;
            mergedPlaces[i].Rank = currentRank;
            mergedPlaces[i].Badge = currentRank switch
            {
                1 => "TOP 1",
                2 => "TOP 2",
                3 => "TOP 3",
                _ => null
            };
        }

        int totalCount = mergedPlaces.Count;
        var paginatedPlaces = mergedPlaces.Skip(offset).Take(safePageSize).ToList();

        for (int i = 0; i < paginatedPlaces.Count; i++)
        {
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
                new CommandDefinition(reviewSql, new { PlaceId = paginatedPlaces[i].Id }, cancellationToken: ct));

            paginatedPlaces[i].FeaturedReview = snippet;
        }

        return new RankingDetailViewDto
        {
            Header = header,
            SubCategories = subCats,
            AvailableProvinces = availableProvinces,
            ProvinceItems = [],
            Items = paginatedPlaces,
            Page = safePage,
            PageSize = safePageSize,
            TotalCount = totalCount
        };
    }

    public async Task<IReadOnlyList<PlaceRankingItemDto>> GetPlaceRankingsAsync(
        int? placeTypeId = null,
        int? categoryId = null,
        int? provinceId = null,
        int? regionId = null,
        string period = "all_time",
        int limit = 10,
        bool includeExcluded = false,
        CancellationToken ct = default)
    {
        var safeLimit = Math.Clamp(limit, 1, 50);
        var connection = _dbContext.Database.GetDbConnection();
        var config = await GetGovernanceConfigAsync(ct);
        var snapshot = await GetSnapshotDataAsync(ct);

        int? periodDays = string.Equals(period, "week", StringComparison.OrdinalIgnoreCase)
            ? 7
            : string.Equals(period, "month", StringComparison.OrdinalIgnoreCase)
                ? 30
                : null;

        const string sql = @"
            SELECT TOP (100)
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
                        + CASE
                            WHEN @PeriodDays IS NULL THEN 0.0
                            ELSE (
                                (SELECT COUNT(1) FROM dbo.Reviews r WHERE r.PlaceId = p.Id AND r.Status = 1 AND r.CreatedAt >= DATEADD(DAY, -@PeriodDays, SYSUTCDATETIME())) * 4.0
                            )
                          END
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
            PlaceTypeId = placeTypeId,
            CategoryId = categoryId,
            ProvinceId = provinceId,
            RegionId = regionId,
            PeriodDays = periodDays
        }, cancellationToken: ct);

        var rawList = (await connection.QueryAsync<PlaceRankingItemDto>(command)).ToList();

        foreach (var item in rawList)
        {
            item.IsExcluded = config.ExcludedPlaceIds.Contains(item.Id);
            item.PinnedRank = config.PinnedPlaces.TryGetValue(item.Id, out int pRank) ? pRank : null;
            ApplyPlaceBreakdownAndScore(item, config);
        }

        // Separate active items (meeting minReviews or explicitly pinned) vs excluded items
        var activeItems = rawList
            .Where(p => !p.IsExcluded && (p.ReviewCount >= config.MinReviews || p.PinnedRank.HasValue))
            .ToList();

        var unpinned = activeItems
            .Where(p => !p.PinnedRank.HasValue)
            .OrderByDescending(p => p.Score)
            .ThenByDescending(p => p.AvgRating)
            .ThenByDescending(p => p.ReviewCount)
            .ToList();

        var pinned = activeItems
            .Where(p => p.PinnedRank.HasValue)
            .OrderBy(p => p.PinnedRank!.Value)
            .ToList();

        var mergedActive = new List<PlaceRankingItemDto>(unpinned);
        foreach (var pinItem in pinned)
        {
            int targetIdx = Math.Clamp(pinItem.PinnedRank!.Value - 1, 0, mergedActive.Count);
            mergedActive.Insert(targetIdx, pinItem);
        }

        var topActive = mergedActive.Take(safeLimit).ToList();

        for (int i = 0; i < topActive.Count; i++)
        {
            int currentRank = i + 1;
            var item = topActive[i];
            item.Rank = currentRank;
            item.Badge = currentRank switch
            {
                1 => "TOP 1",
                2 => "TOP 2",
                3 => "TOP 3",
                _ => null
            };

            if (snapshot != null && snapshot.PlaceRanks.Count > 0)
            {
                if (snapshot.PlaceRanks.TryGetValue(item.Id, out int prevRank))
                {
                    item.RankDelta = prevRank - currentRank;
                    item.IsNewTrend = false;
                }
                else
                {
                    item.RankDelta = null;
                    item.IsNewTrend = true;
                }
            }
            else
            {
                ApplyDefaultBaselineTrend(item.Id, currentRank, out int? delta, out bool isNew);
                item.RankDelta = delta;
                item.IsNewTrend = isNew;
            }
        }

        if (includeExcluded)
        {
            var excludedItems = rawList.Where(p => p.IsExcluded).ToList();
            foreach (var ex in excludedItems)
            {
                ex.Rank = 0;
                ex.Badge = null;
                ex.PinnedRank = null;
            }
            topActive.AddRange(excludedItems);
        }

        return topActive;
    }

    public async Task<IReadOnlyList<ProvinceRankingItemDto>> GetProvinceRankingsAsync(
        int? regionId = null,
        int limit = 10,
        bool includeExcluded = false,
        CancellationToken ct = default)
    {
        var safeLimit = Math.Clamp(limit, 1, 50);
        var connection = _dbContext.Database.GetDbConnection();
        var config = await GetGovernanceConfigAsync(ct);
        var snapshot = await GetSnapshotDataAsync(ct);

        const string sql = @"
            SELECT TOP (63)
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
            RegionId = regionId
        }, cancellationToken: ct);

        var rawList = (await connection.QueryAsync<ProvinceRankingItemDto>(command)).ToList();

        foreach (var prov in rawList)
        {
            prov.IsExcluded = config.ExcludedProvinceIds.Contains(prov.Id);
            prov.PinnedRank = config.PinnedProvinces.TryGetValue(prov.Id, out int pRank) ? pRank : null;

            double total = Math.Round(prov.Score, 1);
            double ratingPts = Math.Round((double)prov.AvgRating * 20.0, 1);
            double reviewPts = Math.Round(Math.Min(Math.Max(0, total - ratingPts), Math.Log(prov.TotalReviews + 1.0) * 15.0), 1);
            double placePts = Math.Round(Math.Max(0, total - ratingPts - reviewPts), 1);

            prov.RatingScore = ratingPts;
            prov.ReviewScore = reviewPts;
            prov.PlaceCoverageScore = placePts;
            prov.Score = total;
        }

        var activeItems = rawList.Where(p => !p.IsExcluded).ToList();
        var unpinned = activeItems
            .Where(p => !p.PinnedRank.HasValue)
            .OrderByDescending(p => p.Score)
            .ThenByDescending(p => p.TotalReviews)
            .ToList();

        var pinned = activeItems
            .Where(p => p.PinnedRank.HasValue)
            .OrderBy(p => p.PinnedRank!.Value)
            .ToList();

        var mergedActive = new List<ProvinceRankingItemDto>(unpinned);
        foreach (var pinItem in pinned)
        {
            int targetIdx = Math.Clamp(pinItem.PinnedRank!.Value - 1, 0, mergedActive.Count);
            mergedActive.Insert(targetIdx, pinItem);
        }

        var topActive = mergedActive.Take(safeLimit).ToList();

        for (int i = 0; i < topActive.Count; i++)
        {
            int currentRank = i + 1;
            var prov = topActive[i];
            prov.Rank = currentRank;
            prov.Badge = currentRank switch
            {
                1 => "TOP 1",
                2 => "TOP 2",
                3 => "TOP 3",
                _ => null
            };

            if (snapshot != null && snapshot.ProvinceRanks.Count > 0)
            {
                if (snapshot.ProvinceRanks.TryGetValue(prov.Id, out int prevRank))
                {
                    prov.RankDelta = prevRank - currentRank;
                    prov.IsNewTrend = false;
                }
                else
                {
                    prov.RankDelta = null;
                    prov.IsNewTrend = true;
                }
            }
            else
            {
                ApplyDefaultBaselineTrend(prov.Id, currentRank, out int? delta, out bool isNew);
                prov.RankDelta = delta;
                prov.IsNewTrend = isNew;
            }
        }

        if (includeExcluded)
        {
            var excludedItems = rawList.Where(p => p.IsExcluded).ToList();
            foreach (var ex in excludedItems)
            {
                ex.Rank = 0;
                ex.Badge = null;
                ex.PinnedRank = null;
            }
            topActive.AddRange(excludedItems);
        }

        return topActive;
    }

    public async Task<IReadOnlyList<DestinationRankingItemDto>> GetDestinationRankingsAsync(
        int? regionId = null,
        int? categoryId = null,
        int limit = 10,
        CancellationToken ct = default)
    {
        var safeLimit = Math.Clamp(limit, 1, 25);
        var connection = _dbContext.Database.GetDbConnection();
        var config = await GetGovernanceConfigAsync(ct);

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
              AND (@CategoryId IS NULL OR EXISTS (SELECT 1 FROM dbo.Places pl WHERE pl.ProvinceId = prov.Id AND pl.CategoryId = @CategoryId AND pl.Status = 1 AND pl.IsDeleted = 0))
            GROUP BY prov.Id, prov.Name, prov.Slug, prov.Tagline, prov.Description, prov.ImageUrl, prov.RegionId, r.Name
            HAVING COUNT(p.Id) > 0
            ORDER BY Score DESC, TotalReviews DESC;";

        var command = new CommandDefinition(sql, new
        {
            Limit = safeLimit + config.ExcludedProvinceIds.Count,
            RegionId = regionId,
            CategoryId = categoryId
        }, cancellationToken: ct);

        var destinations = (await connection.QueryAsync<DestinationRankingItemDto>(command))
            .Where(d => !config.ExcludedProvinceIds.Contains(d.Id))
            .Take(safeLimit)
            .ToList();

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
