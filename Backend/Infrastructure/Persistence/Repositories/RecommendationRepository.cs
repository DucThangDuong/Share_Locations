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

        // 1. Món ăn gắn trực tiếp vào các địa điểm gợi ý (FoodPlaces)
        const string directSql = @"
            SELECT 
                f.Id AS FoodId,
                f.Name,
                f.Slug,
                f.CoverImageUrl,
                f.MinPrice,
                f.MaxPrice,
                fp.PlaceId AS MatchedPlaceId,
                p.Name AS MatchedPlaceName
            FROM dbo.FoodPlaces fp WITH (NOLOCK)
            INNER JOIN dbo.Foods f WITH (NOLOCK) ON fp.FoodId = f.Id
            INNER JOIN dbo.Places p WITH (NOLOCK) ON fp.PlaceId = p.Id
            WHERE fp.PlaceId IN @PlaceIds
              AND f.Status = 1
              AND p.IsDeleted = 0;";

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

        // 2. Mở rộng sang đặc sản cùng Tỉnh/Thành (FoodProvinces) của các địa điểm gợi ý
        if (foodDict.Count < topK)
        {
            const string provinceSql = @"
                SELECT 
                    f.Id AS FoodId,
                    f.Name,
                    f.Slug,
                    f.CoverImageUrl,
                    f.MinPrice,
                    f.MaxPrice,
                    p.Id AS MatchedPlaceId,
                    p.Name AS MatchedPlaceName
                FROM dbo.Places p WITH (NOLOCK)
                INNER JOIN dbo.FoodProvinces fpr WITH (NOLOCK) ON p.ProvinceId = fpr.ProvinceId
                INNER JOIN dbo.Foods f WITH (NOLOCK) ON fpr.FoodId = f.Id
                WHERE p.Id IN @PlaceIds
                  AND f.Status = 1
                  AND p.IsDeleted = 0;";

            var provinceFoods = (await connection.QueryAsync<RecommendedFoodDto>(
                new CommandDefinition(provinceSql, new { PlaceIds = placeIds }, cancellationToken: ct))).AsList();

            foreach (var f in provinceFoods)
            {
                if (foodDict.ContainsKey(f.FoodId))
                    continue;

                f.PlaceMatchPercentage = placeMatchScores.GetValueOrDefault(f.MatchedPlaceId, 70.0);
                if (!foodDict.TryGetValue(f.FoodId, out var existing) || f.PlaceMatchPercentage > existing.PlaceMatchPercentage)
                {
                    foodDict[f.FoodId] = f;
                }
            }
        }

        // 3. Nếu vẫn chưa đủ topK món ăn, bổ sung các đặc sản nổi bật khác trong hệ thống
        if (foodDict.Count < topK)
        {
            var excludedIds = foodDict.Keys.Count > 0 ? foodDict.Keys.ToArray() : new long[] { -1 };
            const string fallbackAllSql = @"
                SELECT TOP (@RemainCount)
                    f.Id AS FoodId,
                    f.Name,
                    f.Slug,
                    f.CoverImageUrl,
                    f.MinPrice,
                    f.MaxPrice,
                    0 AS MatchedPlaceId,
                    N'Đặc sản ẩm thực nổi bật' AS MatchedPlaceName
                FROM dbo.Foods f WITH (NOLOCK)
                WHERE f.Status = 1
                  AND f.Id NOT IN @ExcludedFoodIds
                ORDER BY f.Id ASC;";

            var remainingFoods = await connection.QueryAsync<RecommendedFoodDto>(
                new CommandDefinition(fallbackAllSql, new
                {
                    RemainCount = topK - foodDict.Count,
                    ExcludedFoodIds = excludedIds
                }, cancellationToken: ct));

            foreach (var f in remainingFoods)
            {
                f.PlaceMatchPercentage = 60.0;
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
}
