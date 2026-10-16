using System.Text.Json;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using Application.Services;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Infrastructure.Services;

public class RecommendationService : IRecommendationService
{
    private const string CatalogCacheKey = "langthang:knn:place_catalog";
    private static string GetUserVectorCacheKey(long userId, bool strict) => $"langthang:knn:user_vec:{userId}:strict_{strict}";

    private readonly IRecommendationRepository _repo;
    private readonly IMemoryCache _memoryCache;
    private readonly IDistributedCache _distributedCache;
    private readonly RecommendationOptions _options;
    private readonly ILogger<RecommendationService> _logger;

    public RecommendationService(
        IRecommendationRepository repo,
        IMemoryCache memoryCache,
        IDistributedCache distributedCache,
        IOptions<RecommendationOptions> options,
        ILogger<RecommendationService> logger)
    {
        _repo = repo;
        _memoryCache = memoryCache;
        _distributedCache = distributedCache;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<List<RecommendedPlaceDto>> GetRecommendationsForUserAsync(
        long? userId,
        int topK = 10,
        int? filterProvinceId = null,
        int? filterCategoryId = null,
        CancellationToken ct = default)
    {
        var catalog = await GetOrLoadPlaceCatalogAsync(ct);
        if (catalog.PlacesById.Count == 0)
            return new List<RecommendedPlaceDto>();

        if (!userId.HasValue || userId.Value <= 0)
        {
            return GetColdStartRecommendations(catalog, new HashSet<long>(), topK, filterProvinceId, filterCategoryId);
        }

        var userVector = await GetOrBuildUserPreferenceVectorAsync(userId.Value, catalog, ct);

        if (userVector.IsColdStart)
        {
            return GetColdStartRecommendations(catalog, userVector.ExcludedPlaceIds, topK, filterProvinceId, filterCategoryId);
        }

        var candidates = catalog.PlacesById.Values
            .Where(p => !userVector.ExcludedPlaceIds.Contains(p.PlaceId));

        if (filterProvinceId.HasValue)
            candidates = candidates.Where(p => p.ProvinceId == filterProvinceId.Value);

        if (filterCategoryId.HasValue)
            candidates = candidates.Where(p => p.CategoryId == filterCategoryId.Value);

        var rankedResults = candidates
            .Select(p =>
            {
                var (sim, reason) = KnnMathEngine.ComputeCosineAndExplain(userVector, p);
                return MapToDto(p, sim, isColdStart: false, reason);
            })
            .OrderByDescending(x => Math.Round(x.CosineSimilarity, 6))
            .ThenByDescending(x => x.AvgRating)
            .ThenByDescending(x => x.ReviewCount)
            .Take(topK)
            .ToList();

        return rankedResults;
    }

    public async Task<List<RecommendedPlaceDto>> GetSimilarPlacesAsync(
        long currentPlaceId,
        int topK = 6,
        double? maxRadiusKm = null,
        CancellationToken ct = default)
    {
        var catalog = await GetOrLoadPlaceCatalogAsync(ct);
        if (!catalog.PlacesById.TryGetValue(currentPlaceId, out var targetPlace))
            return new List<RecommendedPlaceDto>();

        var candidates = catalog.PlacesById.Values
            .Where(p => p.PlaceId != currentPlaceId);

        if (maxRadiusKm.HasValue && targetPlace.Latitude.HasValue && targetPlace.Longitude.HasValue)
        {
            candidates = candidates.Where(p =>
                p.Latitude.HasValue && p.Longitude.HasValue &&
                KnnMathEngine.ComputeDistanceKm(
                    targetPlace.Latitude.Value, targetPlace.Longitude.Value,
                    p.Latitude.Value, p.Longitude.Value) <= maxRadiusKm.Value);
        }

        return candidates
            .Select(p =>
            {
                double sim = KnnMathEngine.ComputeItemToItemCosine(targetPlace, p);
                string reason = p.CategoryId == targetPlace.CategoryId && p.ProvinceId == targetPlace.ProvinceId
                    ? $"Cùng danh mục {p.CategoryName} tại {p.ProvinceName}"
                    : $"Tương đồng về loại hình và mức đánh giá ({p.AvgRating:0.0}★)";

                return MapToDto(p, sim, isColdStart: false, reason);
            })
            .OrderByDescending(x => Math.Round(x.CosineSimilarity, 6))
            .ThenByDescending(x => x.AvgRating)
            .ThenByDescending(x => x.ReviewCount)
            .Take(topK)
            .ToList();
    }

    public async Task<List<RecommendedPlaceDto>> GetTripPlaceSuggestionsAsync(
        long tripId,
        int? overrideProvinceId = null,
        int topK = 10,
        CancellationToken ct = default)
    {
        var catalog = await GetOrLoadPlaceCatalogAsync(ct);
        var (dominantProvinceId, memberUserIds, existingTripPlaceIds) = await _repo.GetTripContextAsync(tripId, ct);

        int? targetProvinceId = overrideProvinceId ?? dominantProvinceId;

        var memberVectors = new List<UserPreferenceVector>();
        foreach (var memberId in memberUserIds)
        {
            var vec = await GetOrBuildUserPreferenceVectorAsync(memberId, catalog, ct);
            if (!vec.IsColdStart)
                memberVectors.Add(vec);
        }

        var groupVector = KnnMathEngine.MergeGroupPreferenceVectors(memberVectors);

        if (groupVector.IsColdStart)
        {
            return GetColdStartRecommendations(catalog, existingTripPlaceIds, topK, targetProvinceId, null);
        }

        if (targetProvinceId.HasValue && !groupVector.ProvinceWeights.ContainsKey(targetProvinceId.Value))
        {
            groupVector.ProvinceWeights[targetProvinceId.Value] = 1.0;
            groupVector.VectorNorm = KnnMathEngine.ComputeUserVectorNorm(groupVector);
        }

        var candidates = catalog.PlacesById.Values
            .Where(p => !existingTripPlaceIds.Contains(p.PlaceId));

        if (targetProvinceId.HasValue)
            candidates = candidates.Where(p => p.ProvinceId == targetProvinceId.Value);

        return candidates
            .Select(p =>
            {
                var (sim, _) = KnnMathEngine.ComputeCosineAndExplain(groupVector, p);
                string reason = memberVectors.Count > 1
                    ? $"Phù hợp với sở thích chung của {memberVectors.Count} thành viên trong chuyến đi ({p.CategoryName})"
                    : $"Phù hợp để thêm vào lịch trình ({p.CategoryName} tại {p.ProvinceName})";

                return MapToDto(p, sim, isColdStart: false, reason);
            })
            .OrderByDescending(x => Math.Round(x.CosineSimilarity, 6))
            .ThenByDescending(x => x.AvgRating)
            .ThenByDescending(x => x.ReviewCount)
            .Take(topK)
            .ToList();
    }

    public async Task<List<RecommendedFoodDto>> GetRecommendedFoodsForUserAsync(
        long? userId,
        int topK = 8,
        CancellationToken ct = default)
    {
        var topPlaces = await GetRecommendationsForUserAsync(userId, topK: 25, ct: ct);
        if (topPlaces.Count == 0)
            return new List<RecommendedFoodDto>();

        var placeMatchMap = topPlaces.ToDictionary(x => x.PlaceId, x => x.MatchPercentage);
        return await _repo.GetFoodsByTopPlacesAsync(placeMatchMap, topK, ct);
    }

    private static List<RecommendedPlaceDto> GetColdStartRecommendations(
        PlaceVectorCatalog catalog,
        HashSet<long> excludedPlaceIds,
        int topK,
        int? filterProvinceId,
        int? filterCategoryId)
    {
        var query = catalog.PlacesById.Values
            .Where(p => !excludedPlaceIds.Contains(p.PlaceId));

        if (filterProvinceId.HasValue)
            query = query.Where(p => p.ProvinceId == filterProvinceId.Value);

        if (filterCategoryId.HasValue)
            query = query.Where(p => p.CategoryId == filterCategoryId.Value);

        return query
            .OrderByDescending(p => p.AvgRating)
            .ThenByDescending(p => p.ReviewCount)
            .Take(topK)
            .Select(p => MapToDto(
                p,
                cosineSim: 0.0,
                isColdStart: true,
                reason: $"Địa điểm nổi bật được đánh giá cao ({p.AvgRating:0.0}★ từ {p.ReviewCount} đánh giá)"))
            .ToList();
    }

    private async Task<PlaceVectorCatalog> GetOrLoadPlaceCatalogAsync(CancellationToken ct)
    {
        if (_memoryCache.TryGetValue(CatalogCacheKey, out PlaceVectorCatalog? cachedCatalog) && cachedCatalog != null)
        {
            return cachedCatalog;
        }

        try
        {
            var redisJson = await _distributedCache.GetStringAsync(CatalogCacheKey, ct);
            if (!string.IsNullOrEmpty(redisJson))
            {
                var catalogFromRedis = JsonSerializer.Deserialize<PlaceVectorCatalog>(redisJson);
                if (catalogFromRedis != null && catalogFromRedis.PlacesById.Count > 0)
                {
                    _memoryCache.Set(CatalogCacheKey, catalogFromRedis, TimeSpan.FromMinutes(5));
                    return catalogFromRedis;
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Không thể đọc PlaceVectorCatalog từ Redis, chuyển sang tính trực tiếp từ SQL.");
        }

        return await RefreshPlaceCatalogCacheAsync(ct);
    }

    public async Task<PlaceVectorCatalog> RefreshPlaceCatalogCacheAsync(CancellationToken ct = default)
    {
        var rawPlaces = await _repo.GetAllActivePlacesAsync(ct);
        var catalog = KnnMathEngine.BuildPlaceCatalog(rawPlaces);

        _memoryCache.Set(CatalogCacheKey, catalog, TimeSpan.FromMinutes(_options.PlaceCatalogCacheMinutes));

        try
        {
            var json = JsonSerializer.Serialize(catalog);
            await _distributedCache.SetStringAsync(
                CatalogCacheKey,
                json,
                new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(_options.PlaceCatalogCacheMinutes)
                },
                ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Không thể ghi PlaceVectorCatalog vào Redis.");
        }

        return catalog;
    }

    private async Task<UserPreferenceVector> GetOrBuildUserPreferenceVectorAsync(
        long userId, PlaceVectorCatalog catalog, CancellationToken ct)
    {
        string cacheKey = GetUserVectorCacheKey(userId, _options.StrictTheoryMode);

        if (_memoryCache.TryGetValue(cacheKey, out UserPreferenceVector? memVec) && memVec != null)
            return memVec;

        try
        {
            var redisJson = await _distributedCache.GetStringAsync(cacheKey, ct);
            if (!string.IsNullOrEmpty(redisJson))
            {
                var redisVec = JsonSerializer.Deserialize<UserPreferenceVector>(redisJson);
                if (redisVec != null)
                {
                    _memoryCache.Set(cacheKey, redisVec, TimeSpan.FromMinutes(10));
                    return redisVec;
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Lỗi đọc UserPreferenceVector từ Redis cho UserId={UserId}", userId);
        }

        List<UserInteractionRecord> positiveInteractions;
        if (_options.StrictTheoryMode)
        {
            positiveInteractions = await _repo.GetPositiveReviewsStrictAsync(userId, ct);
        }
        else
        {
            positiveInteractions = await _repo.GetPositiveReviewsStrictAsync(userId, ct);
            if (positiveInteractions.Count < 3)
            {
                positiveInteractions = await _repo.GetHybridPositiveInteractionsAsync(userId, ct);
            }
        }

        var excludedIds = await _repo.GetUserExcludedPlaceIdsAsync(userId, _options.StrictTheoryMode, ct);
        var userVector = KnnMathEngine.BuildUserPreferenceVector(userId, positiveInteractions, excludedIds, catalog, _options);

        var serializedVec = JsonSerializer.Serialize(userVector);
        _memoryCache.Set(cacheKey, userVector, TimeSpan.FromMinutes(_options.UserVectorCacheMinutes));

        try
        {
            await _distributedCache.SetStringAsync(
                cacheKey,
                serializedVec,
                new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(_options.UserVectorCacheMinutes)
                },
                ct);

            if (!userVector.IsColdStart)
            {
                await _repo.SaveUserPreferenceSnapshotAsync(userVector, serializedVec, ct);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Không thể lưu cache/snapshot cho UserId={UserId}", userId);
        }

        return userVector;
    }

    public async Task InvalidateUserVectorCacheAsync(long userId, CancellationToken ct = default)
    {
        string keyStrict = GetUserVectorCacheKey(userId, true);
        string keyHybrid = GetUserVectorCacheKey(userId, false);

        _memoryCache.Remove(keyStrict);
        _memoryCache.Remove(keyHybrid);

        try
        {
            await _distributedCache.RemoveAsync(keyStrict, ct);
            await _distributedCache.RemoveAsync(keyHybrid, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Lỗi xóa Redis cache cho UserId={UserId}", userId);
        }
    }

    private static RecommendedPlaceDto MapToDto(
        PlaceFeatureVector p, double cosineSim, bool isColdStart, string reason)
    {
        return new RecommendedPlaceDto
        {
            PlaceId = p.PlaceId,
            Name = p.Name,
            Slug = p.Slug,
            CoverImageUrl = p.CoverImageUrl,
            Address = p.Address,
            CategoryId = p.CategoryId,
            CategoryName = p.CategoryName,
            ProvinceId = p.ProvinceId,
            ProvinceName = p.ProvinceName,
            AvgRating = p.AvgRating,
            ReviewCount = p.ReviewCount,
            MinPrice = p.MinPrice,
            MaxPrice = p.MaxPrice,
            CosineSimilarity = Math.Round(cosineSim, 4),
            IsColdStartFallback = isColdStart,
            ExplainReason = reason
        };
    }
}
