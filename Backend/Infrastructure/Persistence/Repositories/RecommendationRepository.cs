using System.Data;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using Dapper;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class RecommendationRepository : IRecommendationRepository
{
    private readonly TravelReviewDbContext _dbContext;

    public RecommendationRepository(TravelReviewDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<PlaceFeatureVector>> GetAllActivePlacesAsync(CancellationToken ct = default)
    {
        const string sql = @"
            SELECT 
                p.Id AS PlaceId,
                p.Name,
                p.Slug,
                COALESCE(NULLIF(p.CoverImageUrl, ''), (SELECT TOP 1 pm.Url FROM dbo.PlaceMedia pm WHERE pm.PlaceId = p.Id ORDER BY pm.DisplayOrder)) AS CoverImageUrl,
                p.Address,
                p.CategoryId,
                c.Name AS CategoryName,
                c.PlaceTypeId,
                p.ProvinceId,
                pr.Name AS ProvinceName,
                pr.RegionId,
                CAST(p.AvgRating AS DECIMAL(3,2)) AS AvgRating,
                p.ReviewCount,
                p.MinPrice,
                p.MaxPrice,
                CAST(p.Latitude AS FLOAT) AS Latitude,
                CAST(p.Longitude AS FLOAT) AS Longitude
            FROM dbo.Places p WITH (NOLOCK)
            INNER JOIN dbo.Categories c WITH (NOLOCK) ON p.CategoryId = c.Id
            INNER JOIN dbo.Provinces pr WITH (NOLOCK) ON p.ProvinceId = pr.Id
            WHERE p.Status = 1 
              AND p.IsDeleted = 0
              AND c.Status = 1
              AND pr.Status = 1;";

        var connection = _dbContext.Database.GetDbConnection();
        var result = await connection.QueryAsync<PlaceFeatureVector>(new CommandDefinition(sql, cancellationToken: ct));
        return result.AsList();
    }

    public async Task<List<UserInteractionRecord>> GetPositiveReviewsStrictAsync(long userId, CancellationToken ct = default)
    {
        const string sql = @"
            WITH LatestUserReviews AS (
                SELECT 
                    r.PlaceId,
                    r.Rating,
                    r.CreatedAt,
                    ROW_NUMBER() OVER (PARTITION BY r.PlaceId ORDER BY r.CreatedAt DESC) AS rn
                FROM dbo.Reviews r WITH (NOLOCK)
                INNER JOIN dbo.Places p WITH (NOLOCK) ON r.PlaceId = p.Id
                WHERE r.UserId = @UserId 
                  AND r.Status = 1 
                  AND r.Rating >= 4
                  AND p.IsDeleted = 0
            )
            SELECT 
                PlaceId,
                1.0 AS Weight,
                CreatedAt AS InteractedAtUtc
            FROM LatestUserReviews
            WHERE rn = 1;";

        var connection = _dbContext.Database.GetDbConnection();
        var rows = await connection.QueryAsync<UserInteractionRecord>(
            new CommandDefinition(sql, new { UserId = userId }, cancellationToken: ct));
        return rows.AsList();
    }

    public async Task<List<UserInteractionRecord>> GetHybridPositiveInteractionsAsync(long userId, CancellationToken ct = default)
    {
        const string sql = @"
            WITH RawSignals AS (
                SELECT 
                    r.PlaceId,
                    CASE WHEN r.Rating = 5 THEN 5.0 ELSE 3.5 END AS Weight,
                    r.CreatedAt AS InteractedAtUtc
                FROM dbo.Reviews r WITH (NOLOCK)
                INNER JOIN dbo.Places p WITH (NOLOCK) ON r.PlaceId = p.Id
                WHERE r.UserId = @UserId AND r.Status = 1 AND r.Rating >= 4 AND p.IsDeleted = 0

                UNION ALL

                SELECT 
                    tp.PlaceId,
                    4.0 AS Weight,
                    t.UpdatedAt AS InteractedAtUtc
                FROM dbo.TripPlaces tp WITH (NOLOCK)
                INNER JOIN dbo.Places p WITH (NOLOCK) ON tp.PlaceId = p.Id
                INNER JOIN dbo.TripDays td WITH (NOLOCK) ON tp.TripDayId = td.Id
                INNER JOIN dbo.Trips t WITH (NOLOCK) ON td.TripId = t.Id
                LEFT JOIN dbo.TripMembers tm WITH (NOLOCK) ON t.Id = tm.TripId AND tm.UserId = @UserId
                WHERE (t.UserId = @UserId OR tm.UserId IS NOT NULL) AND p.IsDeleted = 0

                UNION ALL

                SELECT 
                    PlaceId,
                    3.0 AS Weight,
                    CreatedAt AS InteractedAtUtc
                FROM dbo.VisitLogs WITH (NOLOCK)
                WHERE UserId = @UserId AND (Rating IS NULL OR Rating >= 4)

                UNION ALL

                SELECT 
                    TargetId AS PlaceId,
                    3.0 AS Weight,
                    CreatedAt AS InteractedAtUtc
                FROM dbo.Favorites WITH (NOLOCK)
                WHERE UserId = @UserId AND TargetType = 1

                UNION ALL

                SELECT TOP 30
                    PlaceId,
                    1.0 AS Weight,
                    ViewedAt AS InteractedAtUtc
                FROM dbo.AccessHistories WITH (NOLOCK)
                WHERE UserId = @UserId
                ORDER BY ViewedAt DESC
            ),
            ExcludedNegative AS (
                SELECT PlaceId FROM dbo.Reviews WITH (NOLOCK) WHERE UserId = @UserId AND Status = 1 AND Rating <= 3
                UNION
                SELECT PlaceId FROM dbo.VisitLogs WITH (NOLOCK) WHERE UserId = @UserId AND Rating IS NOT NULL AND Rating <= 3
            )
            SELECT 
                s.PlaceId,
                MAX(s.Weight) AS Weight,
                MAX(s.InteractedAtUtc) AS InteractedAtUtc
            FROM RawSignals s
            WHERE NOT EXISTS (SELECT 1 FROM ExcludedNegative ex WHERE ex.PlaceId = s.PlaceId)
            GROUP BY s.PlaceId;";

        var connection = _dbContext.Database.GetDbConnection();
        var rows = await connection.QueryAsync<UserInteractionRecord>(
            new CommandDefinition(sql, new { UserId = userId }, cancellationToken: ct));
        return rows.AsList();
    }

    public async Task<HashSet<long>> GetUserExcludedPlaceIdsAsync(long userId, bool strictMode, CancellationToken ct = default)
    {
        string sql = strictMode
            ? @"SELECT DISTINCT PlaceId FROM dbo.Reviews WITH (NOLOCK) WHERE UserId = @UserId;"
            : @"SELECT PlaceId FROM dbo.Reviews WITH (NOLOCK) WHERE UserId = @UserId
                UNION
                SELECT PlaceId FROM dbo.VisitLogs WITH (NOLOCK) WHERE UserId = @UserId;";

        var connection = _dbContext.Database.GetDbConnection();
        var ids = await connection.QueryAsync<long>(new CommandDefinition(sql, new { UserId = userId }, cancellationToken: ct));
        return ids.ToHashSet();
    }

    public async Task<(int? TargetProvinceId, List<long> MemberUserIds, HashSet<long> ExistingTripPlaceIds)> GetTripContextAsync(
        long tripId, CancellationToken ct = default)
    {
        const string sql = @"
            SELECT UserId FROM dbo.Trips WITH (NOLOCK) WHERE Id = @TripId
            UNION
            SELECT UserId FROM dbo.TripMembers WITH (NOLOCK) WHERE TripId = @TripId;

            SELECT tp.PlaceId, p.ProvinceId
            FROM dbo.TripPlaces tp WITH (NOLOCK)
            INNER JOIN dbo.TripDays td WITH (NOLOCK) ON tp.TripDayId = td.Id
            INNER JOIN dbo.Places p WITH (NOLOCK) ON tp.PlaceId = p.Id
            WHERE td.TripId = @TripId AND p.IsDeleted = 0;";

        var connection = _dbContext.Database.GetDbConnection();
        using var multi = await connection.QueryMultipleAsync(new CommandDefinition(sql, new { TripId = tripId }, cancellationToken: ct));

        var memberIds = (await multi.ReadAsync<long>()).AsList();
        var tripPlaces = (await multi.ReadAsync<(long PlaceId, int ProvinceId)>()).AsList();

        var existingPlaceIds = tripPlaces.Select(x => x.PlaceId).ToHashSet();

        int? dominantProvinceId = tripPlaces
            .GroupBy(x => x.ProvinceId)
            .OrderByDescending(g => g.Count())
            .Select(g => (int?)g.Key)
            .FirstOrDefault();

        return (dominantProvinceId, memberIds, existingPlaceIds);
    }

    public async Task<List<RecommendedFoodDto>> GetFoodsByTopPlacesAsync(
        Dictionary<long, double> placeMatchScores, int topK, CancellationToken ct = default)
    {
        if (placeMatchScores.Count == 0) return new List<RecommendedFoodDto>();

        var placeIds = placeMatchScores.Keys.ToArray();
        var connection = _dbContext.Database.GetDbConnection();
        var foodDict = new Dictionary<long, RecommendedFoodDto>();

        const string directSql = @"
            SELECT 
                f.Id AS FoodId,
                f.Name,
                f.Slug,
                f.CoverImageUrl,
                f.MinPrice,
                f.MaxPrice,
                p.Id AS MatchedPlaceId,
                p.Name AS MatchedPlaceName,
                p.Address AS MatchedPlaceAddress,
                p.AvgRating AS MatchedPlaceRating
            FROM dbo.FoodPlaces fp WITH (NOLOCK)
            INNER JOIN dbo.Foods f WITH (NOLOCK) ON fp.FoodId = f.Id
            INNER JOIN dbo.Places p WITH (NOLOCK) ON fp.PlaceId = p.Id
            WHERE fp.PlaceId IN @PlaceIds
              AND f.Status = 1
              AND p.IsDeleted = 0
              AND p.Status = 1;";

        var directFoods = (await connection.QueryAsync<RecommendedFoodDto>(
            new CommandDefinition(directSql, new { PlaceIds = placeIds }, cancellationToken: ct))).AsList();

        foreach (var f in directFoods)
        {
            f.PlaceMatchPercentage = placeMatchScores.GetValueOrDefault(f.MatchedPlaceId, 0.0);
            if (!foodDict.TryGetValue(f.FoodId, out var existing) || f.PlaceMatchPercentage > existing.PlaceMatchPercentage)
            {
                foodDict[f.FoodId] = f;
            }
        }

        if (foodDict.Count < topK)
        {
            var excludedIds = foodDict.Keys.Count > 0 ? foodDict.Keys.ToArray() : new long[] { -1 };
            const string provinceSql = @"
                WITH RankedProvinceFoodPlaces AS (
                    SELECT 
                        f.Id AS FoodId,
                        f.Name,
                        f.Slug,
                        f.CoverImageUrl,
                        f.MinPrice,
                        f.MaxPrice,
                        p.Id AS MatchedPlaceId,
                        p.Name AS MatchedPlaceName,
                        p.Address AS MatchedPlaceAddress,
                        p.AvgRating AS MatchedPlaceRating,
                        ROW_NUMBER() OVER (
                            PARTITION BY f.Id 
                            ORDER BY 
                                CASE WHEN p.ProvinceId = fpr.ProvinceId THEN 1 ELSE 0 END DESC,
                                p.AvgRating DESC, 
                                p.ReviewCount DESC, 
                                p.Id ASC
                        ) AS rn
                    FROM dbo.FoodProvinces fpr WITH (NOLOCK)
                    INNER JOIN dbo.Foods f WITH (NOLOCK) ON fpr.FoodId = f.Id
                    INNER JOIN dbo.FoodPlaces fp WITH (NOLOCK) ON f.Id = fp.FoodId
                    INNER JOIN dbo.Places p WITH (NOLOCK) ON fp.PlaceId = p.Id
                    WHERE fpr.ProvinceId IN (
                        SELECT DISTINCT p_user.ProvinceId 
                        FROM dbo.Places p_user WITH (NOLOCK) 
                        WHERE p_user.Id IN @PlaceIds AND p_user.ProvinceId IS NOT NULL
                    )
                      AND f.Status = 1
                      AND p.IsDeleted = 0
                      AND p.Status = 1
                      AND f.Id NOT IN @ExcludedFoodIds
                )
                SELECT 
                    FoodId, Name, Slug, CoverImageUrl, MinPrice, MaxPrice,
                    MatchedPlaceId, MatchedPlaceName, MatchedPlaceAddress, MatchedPlaceRating
                FROM RankedProvinceFoodPlaces
                WHERE rn = 1;";

            var provinceFoods = (await connection.QueryAsync<RecommendedFoodDto>(
                new CommandDefinition(provinceSql, new
                {
                    PlaceIds = placeIds,
                    ExcludedFoodIds = excludedIds
                }, cancellationToken: ct))).AsList();

            foreach (var f in provinceFoods)
            {
                if (foodDict.ContainsKey(f.FoodId))
                    continue;

                f.PlaceMatchPercentage = 75.0;
                foodDict[f.FoodId] = f;
            }
        }

        if (foodDict.Count < topK)
        {
            var excludedIds = foodDict.Keys.Count > 0 ? foodDict.Keys.ToArray() : new long[] { -1 };
            int remainCount = topK - foodDict.Count;

            const string topAllFoodsSql = @"
                WITH RankedAllFoods AS (
                    SELECT 
                        f.Id AS FoodId,
                        f.Name,
                        f.Slug,
                        f.CoverImageUrl,
                        f.MinPrice,
                        f.MaxPrice,
                        p.Id AS MatchedPlaceId,
                        p.Name AS MatchedPlaceName,
                        p.Address AS MatchedPlaceAddress,
                        p.AvgRating AS MatchedPlaceRating,
                        ROW_NUMBER() OVER (
                            PARTITION BY f.Id 
                            ORDER BY 
                                p.AvgRating DESC, 
                                p.ReviewCount DESC, 
                                p.Id ASC
                        ) AS rn
                    FROM dbo.Foods f WITH (NOLOCK)
                    INNER JOIN dbo.FoodPlaces fp WITH (NOLOCK) ON f.Id = fp.FoodId
                    INNER JOIN dbo.Places p WITH (NOLOCK) ON fp.PlaceId = p.Id
                    WHERE f.Status = 1
                      AND p.IsDeleted = 0
                      AND p.Status = 1
                      AND f.Id NOT IN @ExcludedFoodIds
                )
                SELECT TOP (@RemainCount)
                    FoodId, Name, Slug, CoverImageUrl, MinPrice, MaxPrice,
                    MatchedPlaceId, MatchedPlaceName, MatchedPlaceAddress, MatchedPlaceRating
                FROM RankedAllFoods
                WHERE rn = 1
                ORDER BY MatchedPlaceRating DESC, FoodId ASC;";

            var remainingFoods = (await connection.QueryAsync<RecommendedFoodDto>(
                new CommandDefinition(topAllFoodsSql, new
                {
                    RemainCount = remainCount,
                    ExcludedFoodIds = excludedIds
                }, cancellationToken: ct))).AsList();

            foreach (var f in remainingFoods)
            {
                f.PlaceMatchPercentage = 60.0;
                foodDict[f.FoodId] = f;
            }
        }

        if (foodDict.Count < topK)
        {
            var excludedIds = foodDict.Keys.Count > 0 ? foodDict.Keys.ToArray() : new long[] { -1 };
            int remainCount = topK - foodDict.Count;

            const string fallbackAllSql = @"
                SELECT TOP (@RemainCount)
                    f.Id AS FoodId,
                    f.Name,
                    f.Slug,
                    f.CoverImageUrl,
                    f.MinPrice,
                    f.MaxPrice,
                    0 AS MatchedPlaceId,
                    CAST(NULL AS NVARCHAR) AS MatchedPlaceName,
                    CAST(NULL AS NVARCHAR) AS MatchedPlaceAddress,
                    CAST(NULL AS DECIMAL(3,2)) AS MatchedPlaceRating
                FROM dbo.Foods f WITH (NOLOCK)
                WHERE f.Status = 1
                  AND f.Id NOT IN @ExcludedFoodIds
                ORDER BY f.Id ASC;";

            var lastResortFoods = await connection.QueryAsync<RecommendedFoodDto>(
                new CommandDefinition(fallbackAllSql, new
                {
                    RemainCount = remainCount,
                    ExcludedFoodIds = excludedIds
                }, cancellationToken: ct));

            foreach (var f in lastResortFoods)
            {
                f.PlaceMatchPercentage = 50.0;
                foodDict[f.FoodId] = f;
            }
        }

        return foodDict.Values
            .OrderByDescending(f => f.PlaceMatchPercentage)
            .ThenBy(f => f.FoodId)
            .Take(topK)
            .ToList();
    }

    public async Task SaveUserPreferenceSnapshotAsync(UserPreferenceVector vector, string jsonPayload, CancellationToken ct = default)
    {
        const string sql = @"
            MERGE dbo.UserPreferenceProfiles AS target
            USING (SELECT @UserId AS UserId) AS source
            ON (target.UserId = source.UserId)
            WHEN MATCHED THEN
                UPDATE SET 
                    VectorJson = @VectorJson,
                    PositiveSampleCount = @PositiveSampleCount,
                    VectorNorm = @VectorNorm,
                    UpdatedAt = SYSUTCDATETIME()
            WHEN NOT MATCHED THEN
                INSERT (UserId, VectorJson, PositiveSampleCount, VectorNorm, UpdatedAt)
                VALUES (@UserId, @VectorJson, @PositiveSampleCount, @VectorNorm, SYSUTCDATETIME());";

        var connection = _dbContext.Database.GetDbConnection();
        await connection.ExecuteAsync(new CommandDefinition(sql, new
        {
            vector.UserId,
            VectorJson = jsonPayload,
            vector.PositiveSampleCount,
            vector.VectorNorm
        }, cancellationToken: ct));
    }

    public async Task<List<PlaceRecommendationDto>> GetAllCandidatePlacesAsync(CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();
        const string sql = @"
            SELECT
                p.Id,
                p.Name,
                p.Address,
                p.CategoryId,
                c.Name AS CategoryName,
                p.ProvinceId,
                pr.Name AS ProvinceName,
                CAST(p.AvgRating AS DECIMAL(3,2)) AS AvgRating,
                p.ReviewCount,
                p.MinPrice,
                p.MaxPrice,
                COALESCE(NULLIF(p.CoverImageUrl, ''), (SELECT TOP 1 pm.Url FROM dbo.PlaceMedia pm WHERE pm.PlaceId = p.Id ORDER BY pm.DisplayOrder)) AS CoverImageUrl
            FROM dbo.Places p WITH (NOLOCK)
            LEFT JOIN dbo.Categories c WITH (NOLOCK) ON p.CategoryId = c.Id
            LEFT JOIN dbo.Provinces pr WITH (NOLOCK) ON p.ProvinceId = pr.Id
            WHERE p.Status = 1 AND p.IsDeleted = 0;";

        var command = new CommandDefinition(sql, cancellationToken: ct);
        var places = await connection.QueryAsync<PlaceRecommendationDto>(command);
        return places.AsList();
    }

    public async Task<List<UserReviewFeatureDto>> GetAllReviewsAsync(CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();
        const string sql = @"
            SELECT
                r.UserId,
                r.PlaceId,
                CAST(r.Rating AS FLOAT) AS Rating
            FROM dbo.Reviews r WITH (NOLOCK)
            INNER JOIN dbo.Places p WITH (NOLOCK) ON r.PlaceId = p.Id
            WHERE r.Status = 1 AND p.IsDeleted = 0;";

        var command = new CommandDefinition(sql, cancellationToken: ct);
        var reviews = await connection.QueryAsync<UserReviewFeatureDto>(command);
        return reviews.AsList();
    }

    public async Task<List<NearbyPlaceItemDto>> GetNearbyPlacesByBoundingBoxAsync(double roundedLat, double roundedLng, int topK = 20, CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();
        double minLat = roundedLat - 0.05;
        double maxLat = roundedLat + 0.05;
        double minLng = roundedLng - 0.05;
        double maxLng = roundedLng + 0.05;

        const string sql = @"
            SELECT TOP (@TopK)
                p.Id AS PlaceId,
                p.Name,
                p.Slug,
                COALESCE(NULLIF(p.CoverImageUrl, ''), (SELECT TOP 1 pm.Url FROM dbo.PlaceMedia pm WHERE pm.PlaceId = p.Id ORDER BY pm.DisplayOrder)) AS CoverImageUrl,
                p.Address,
                p.CategoryId,
                c.Name AS CategoryName,
                p.ProvinceId,
                pr.Name AS ProvinceName,
                CAST(p.AvgRating AS DECIMAL(3,2)) AS AvgRating,
                p.ReviewCount,
                p.MinPrice,
                p.MaxPrice,
                CAST(p.Latitude AS FLOAT) AS Latitude,
                CAST(p.Longitude AS FLOAT) AS Longitude
            FROM dbo.Places p WITH (NOLOCK)
            INNER JOIN dbo.Categories c WITH (NOLOCK) ON p.CategoryId = c.Id
            INNER JOIN dbo.Provinces pr WITH (NOLOCK) ON p.ProvinceId = pr.Id
            WHERE p.Status = 1 AND p.IsDeleted = 0
              AND c.Status = 1 AND pr.Status = 1
              AND p.Latitude IS NOT NULL AND p.Longitude IS NOT NULL
              AND p.Latitude BETWEEN @MinLat AND @MaxLat
              AND p.Longitude BETWEEN @MinLng AND @MaxLng
            ORDER BY p.AvgRating DESC, p.ReviewCount DESC;";

        var items = (await connection.QueryAsync<NearbyPlaceItemDto>(
            new CommandDefinition(sql, new { TopK = topK, MinLat = minLat, MaxLat = maxLat, MinLng = minLng, MaxLng = maxLng }, cancellationToken: ct))).AsList();

        return items;
    }

    public async Task<List<SuggestedTripOrCollectionDto>> GetCollectionsAndTripsByProvinceAsync(int? provinceId, int topK = 8, CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();
        var result = new List<SuggestedTripOrCollectionDto>();

        // 1. Get Collections
        const string colSql = @"
            SELECT TOP (@TopK)
                c.Id,
                'collection' AS ItemType,
                c.Title,
                c.Description AS Subtitle,
                c.CoverImageUrl,
                c.ProvinceId,
                prov.Name AS ProvinceName,
                (SELECT COUNT(1) FROM dbo.CollectionPlaces cp INNER JOIN dbo.Places p ON cp.PlaceId = p.Id WHERE cp.CollectionId = c.Id AND p.Status = 1 AND p.IsDeleted = 0) AS PlaceCountOrDays,
                CONCAT('/explore?collection=', c.Id) AS ActionUrl
            FROM dbo.Collections c WITH (NOLOCK)
            LEFT JOIN dbo.Provinces prov WITH (NOLOCK) ON c.ProvinceId = prov.Id
            WHERE c.Status = 1
              AND (@ProvinceId IS NULL OR c.ProvinceId = @ProvinceId OR c.ProvinceId IS NULL)
            ORDER BY (CASE WHEN @ProvinceId IS NOT NULL AND c.ProvinceId = @ProvinceId THEN 0 ELSE 1 END), c.DisplayOrder ASC;";

        var collections = (await connection.QueryAsync<SuggestedTripOrCollectionDto>(
            new CommandDefinition(colSql, new { TopK = topK, ProvinceId = provinceId }, cancellationToken: ct))).AsList();

        if (collections.Count > 0)
        {
            var colIds = collections.Select(c => (int)c.Id).ToList();
            const string colPlacesSql = @"
                SELECT cp.CollectionId, p.Id, p.Name, p.AvgRating, p.ReviewCount
                FROM dbo.CollectionPlaces cp WITH (NOLOCK)
                INNER JOIN dbo.Places p WITH (NOLOCK) ON cp.PlaceId = p.Id
                WHERE cp.CollectionId IN @ColIds AND p.Status = 1 AND p.IsDeleted = 0
                ORDER BY cp.CollectionId, cp.DisplayOrder;";

            var placesRaw = (await connection.QueryAsync<dynamic>(
                new CommandDefinition(colPlacesSql, new { ColIds = colIds }, cancellationToken: ct))).ToList();

            var placeIds = placesRaw.Select(p => (long)p.Id).Distinct().ToList();
            var mediaLookup = new Dictionary<long, List<string>>();
            if (placeIds.Count > 0)
            {
                const string mediaSql = "SELECT PlaceId, Url FROM dbo.PlaceMedia WITH (NOLOCK) WHERE PlaceId IN @PlaceIds ORDER BY PlaceId, DisplayOrder;";
                var medias = await connection.QueryAsync<(long PlaceId, string Url)>(
                    new CommandDefinition(mediaSql, new { PlaceIds = placeIds }, cancellationToken: ct));
                mediaLookup = medias.GroupBy(m => m.PlaceId).ToDictionary(g => g.Key, g => g.Select(x => x.Url).ToList());
            }

            var placesGrouped = placesRaw.GroupBy(p => (int)p.CollectionId).ToDictionary(
                g => g.Key,
                g => g.Select(p => new PlaceCardDto
                {
                    Id = (long)p.Id,
                    Name = (string)p.Name,
                    AvgRating = Convert.ToDecimal(p.AvgRating ?? 0),
                    ReviewCount = Convert.ToInt32(p.ReviewCount ?? 0),
                    MediaUrls = mediaLookup.GetValueOrDefault((long)p.Id, new List<string>())
                }).Take(4).ToList());

            foreach (var col in collections)
            {
                if (placesGrouped.TryGetValue((int)col.Id, out var pList))
                {
                    col.Places = pList;
                }
            }

            result.AddRange(collections);
        }

        // 2. Get Public Trips
        const string tripSql = @"
            SELECT TOP (@TopK)
                t.Id,
                'trip' AS ItemType,
                t.Title,
                t.Description AS Subtitle,
                t.CoverImageUrl,
                (SELECT COUNT(1) FROM dbo.TripDays td WHERE td.TripId = t.Id) AS PlaceCountOrDays,
                (SELECT TOP 1 p.ProvinceId FROM dbo.TripDays td INNER JOIN dbo.TripPlaces tp ON td.Id = tp.TripDayId INNER JOIN dbo.Places p ON tp.PlaceId = p.Id WHERE td.TripId = t.Id AND p.IsDeleted = 0 GROUP BY p.ProvinceId ORDER BY COUNT(1) DESC) AS ProvinceId,
                (SELECT TOP 1 prov.Name FROM dbo.TripDays td INNER JOIN dbo.TripPlaces tp ON td.Id = tp.TripDayId INNER JOIN dbo.Places p ON tp.PlaceId = p.Id INNER JOIN dbo.Provinces prov ON p.ProvinceId = prov.Id WHERE td.TripId = t.Id AND p.IsDeleted = 0 GROUP BY prov.Name ORDER BY COUNT(1) DESC) AS ProvinceName,
                CONCAT('/itinerary/', t.Id) AS ActionUrl
            FROM dbo.Trips t WITH (NOLOCK)
            WHERE t.Privacy = 0
              AND (@ProvinceId IS NULL OR EXISTS (
                  SELECT 1 FROM dbo.TripDays td 
                  INNER JOIN dbo.TripPlaces tp ON td.Id = tp.TripDayId 
                  INNER JOIN dbo.Places p ON tp.PlaceId = p.Id 
                  WHERE td.TripId = t.Id AND p.ProvinceId = @ProvinceId AND p.IsDeleted = 0
              ))
            ORDER BY t.ViewCount DESC, t.UpdatedAt DESC;";

        var trips = (await connection.QueryAsync<SuggestedTripOrCollectionDto>(
            new CommandDefinition(tripSql, new { TopK = topK, ProvinceId = provinceId }, cancellationToken: ct))).AsList();

        result.AddRange(trips);

        return result;
    }
}
