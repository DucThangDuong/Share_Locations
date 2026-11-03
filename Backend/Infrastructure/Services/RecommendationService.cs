using System.Globalization;
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
    private readonly IEnterpriseCacheService? _enterpriseCache;
    private readonly RecommendationOptions _options;
    private readonly ILogger<RecommendationService> _logger;

    public RecommendationService(
        IRecommendationRepository repo,
        IMemoryCache memoryCache,
        IDistributedCache distributedCache,
        IOptions<RecommendationOptions> options,
        ILogger<RecommendationService> logger,
        IEnterpriseCacheService? enterpriseCache = null)
    {
        _repo = repo;
        _memoryCache = memoryCache;
        _distributedCache = distributedCache;
        _options = options.Value;
        _logger = logger;
        _enterpriseCache = enterpriseCache;
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
            Latitude = p.Latitude,
            Longitude = p.Longitude,
            CosineSimilarity = Math.Round(cosineSim, 4),
            IsColdStartFallback = isColdStart,
            ExplainReason = reason
        };
    }

    public async Task<DualContextHomeFeedResponse> GetDualContextHomeFeedAsync(
        string? deviceId,
        double? lat,
        double? lng,
        int? intentProvinceId,
        string? intentLabel,
        IReadOnlyList<int>? topCategoryIds,
        IReadOnlyList<long>? excludePlaceIds,
        int topK = 12,
        IReadOnlyList<int>? intentProvinceIds = null,
        CancellationToken ct = default)
    {
        var catalog = await GetOrLoadPlaceCatalogAsync(ct);

        // 1. Session Profile & Redis Hash
        string? validDeviceId = null;
        if (!string.IsNullOrWhiteSpace(deviceId) && Guid.TryParse(deviceId.Trim(), out var parsedGuid))
        {
            validDeviceId = parsedGuid.ToString("D");
        }

        var effectiveIntentProvinceIds = new List<int>();
        if (intentProvinceIds != null && intentProvinceIds.Count > 0)
        {
            effectiveIntentProvinceIds = intentProvinceIds.Where(id => id > 0).Distinct().Take(3).ToList();
        }
        else if (intentProvinceId.HasValue && intentProvinceId.Value > 0)
        {
            effectiveIntentProvinceIds.Add(intentProvinceId.Value);
        }

        int? effectiveIntentProvinceId = effectiveIntentProvinceIds.Count > 0 ? effectiveIntentProvinceIds[0] : null;
        string? effectiveIntentLabel = intentLabel;
        var effectiveTopCategoryIds = topCategoryIds?.Where(c => c > 0).Take(3).ToList() ?? new List<int>();

        bool hasGpsSignal = lat.HasValue && lng.HasValue;
        bool hasRealSignal = hasGpsSignal || (effectiveIntentProvinceIds.Count > 0) || (effectiveTopCategoryIds.Count > 0);

        string? currentGeohash = null;
        if (hasGpsSignal)
        {
            double rLat = Math.Round(lat!.Value, 2);
            double rLng = Math.Round(lng!.Value, 2);
            currentGeohash = $"lat_{rLat.ToString("F2", CultureInfo.InvariantCulture)}_lng_{rLng.ToString("F2", CultureInfo.InvariantCulture)}";
        }

        if (validDeviceId != null)
        {
            string profileKey = $"anon:profile:{validDeviceId}";
            if (hasRealSignal)
            {
                if (_enterpriseCache != null)
                {
                    var profileToSave = new AnonymousSessionProfileDto
                    {
                        CurrentGeohash = currentGeohash,
                        LastIntentProvinceId = effectiveIntentProvinceId,
                        LastIntentProvinceName = effectiveIntentLabel,
                        IntentProvinceIds = effectiveIntentProvinceIds,
                        TopCategoryIds = effectiveTopCategoryIds
                    };
                    await _enterpriseCache.SetAsync(profileKey, profileToSave, TimeSpan.FromHours(24), ct);
                }
            }
            else if (effectiveIntentProvinceIds.Count == 0 && _enterpriseCache != null)
            {
                var cachedProfile = await _enterpriseCache.GetAsync<AnonymousSessionProfileDto>(profileKey, ct);
                if (cachedProfile != null)
                {
                    if (cachedProfile.IntentProvinceIds != null && cachedProfile.IntentProvinceIds.Count > 0)
                    {
                        effectiveIntentProvinceIds = cachedProfile.IntentProvinceIds.Take(3).ToList();
                        effectiveIntentProvinceId = effectiveIntentProvinceIds.FirstOrDefault();
                        effectiveIntentLabel = cachedProfile.LastIntentProvinceName;
                    }
                    else if (cachedProfile.LastIntentProvinceId.HasValue)
                    {
                        effectiveIntentProvinceIds = new List<int> { cachedProfile.LastIntentProvinceId.Value };
                        effectiveIntentProvinceId = cachedProfile.LastIntentProvinceId.Value;
                        effectiveIntentLabel = cachedProfile.LastIntentProvinceName;
                    }
                    if (effectiveTopCategoryIds.Count == 0 && cachedProfile.TopCategoryIds != null)
                    {
                        effectiveTopCategoryIds = cachedProfile.TopCategoryIds.Take(3).ToList();
                    }
                }
            }
        }

        // 2. Shelf 1: Nearby Places
        double userLat = lat ?? 10.76;
        double userLng = lng ?? 106.66;
        double roundedLat = Math.Round(userLat, 2);
        double roundedLng = Math.Round(userLng, 2);
        string gridKey = $"lat_{roundedLat.ToString("F2", CultureInfo.InvariantCulture)}_lng_{roundedLng.ToString("F2", CultureInfo.InvariantCulture)}";

        // Determine Physical Province
        var closestPlace = catalog.PlacesById.Values
            .Where(p => p.Latitude.HasValue && p.Longitude.HasValue)
            .OrderBy(p => KnnMathEngine.ComputeDistanceKm(userLat, userLng, p.Latitude!.Value, p.Longitude!.Value))
            .FirstOrDefault();
        int physicalProvinceId = closestPlace?.ProvinceId ?? 27; // Default TP.HCM
        string physicalProvinceName = closestPlace?.ProvinceName ?? "TP Hồ Chí Minh";

        string nearbyCacheKey = $"cache:nearby:{gridKey}";
        List<NearbyPlaceItemDto> nearbyCandidates;
        if (_enterpriseCache != null)
        {
            nearbyCandidates = await _enterpriseCache.GetOrCreateAsync(
                nearbyCacheKey,
                async innerCt => await _repo.GetNearbyPlacesByBoundingBoxAsync(roundedLat, roundedLng, 30, innerCt),
                TimeSpan.FromMinutes(15),
                ct) ?? new List<NearbyPlaceItemDto>();
        }
        else
        {
            nearbyCandidates = await _repo.GetNearbyPlacesByBoundingBoxAsync(roundedLat, roundedLng, 30, ct);
        }

        // Clone and recompute distance on RAM from user's exact rawLat, rawLng
        var topCatSet = effectiveTopCategoryIds.ToHashSet();

        var shelf1Pool = nearbyCandidates.Select(c => new NearbyPlaceItemDto
        {
            PlaceId = c.PlaceId,
            Name = c.Name,
            Slug = c.Slug,
            CoverImageUrl = c.CoverImageUrl,
            Address = c.Address,
            CategoryId = c.CategoryId,
            CategoryName = c.CategoryName,
            ProvinceId = c.ProvinceId,
            ProvinceName = c.ProvinceName,
            AvgRating = c.AvgRating,
            ReviewCount = c.ReviewCount,
            MinPrice = c.MinPrice,
            MaxPrice = c.MaxPrice,
            Latitude = c.Latitude,
            Longitude = c.Longitude,
            DistanceKm = (c.Latitude.HasValue && c.Longitude.HasValue)
                ? Math.Round(KnnMathEngine.ComputeDistanceKm(userLat, userLng, c.Latitude.Value, c.Longitude.Value), 1)
                : null,
            ExplainReason = $"Gần bạn tại {physicalProvinceName}"
        }).ToList();

        // Ưu tiên sắp xếp theo Khoảng cách và Danh mục:
        // Nếu địa điểm khớp với TopCategoryIds mà người dùng vừa tìm, giảm trừ 1.5km ảo để đẩy lên đầu
        shelf1Pool = shelf1Pool.OrderBy(c =>
        {
            double dist = c.DistanceKm ?? 9999.0;
            double catBonus = topCatSet.Contains(c.CategoryId) ? 1.5 : 0.0;
            return dist - catBonus;
        }).ThenByDescending(c => c.AvgRating).ToList();

        // Tier 1: Distance <= 5.0 km
        var shelf1 = shelf1Pool.Where(c => c.DistanceKm.HasValue && c.DistanceKm.Value <= 5.0).Take(topK).ToList();

        // Tier 2: If < 4 places in 5km, expand to whole Bounding Box pool (~11km)
        if (shelf1.Count < 4)
        {
            shelf1 = shelf1Pool.Take(topK).ToList();
        }

        // Tier 3: If still < 8 places, top up from province cache
        if (shelf1.Count < 8)
        {
            var existingIds = shelf1.Select(s => s.PlaceId).ToHashSet();
            var provinceTopPlaces = await GetTopPlacesByProvinceCachedAsync(physicalProvinceId, ct);
            foreach (var p in provinceTopPlaces)
            {
                if (existingIds.Contains(p.PlaceId)) continue;
                double? dist = (p.Latitude.HasValue && p.Longitude.HasValue)
                    ? Math.Round(KnnMathEngine.ComputeDistanceKm(userLat, userLng, p.Latitude.Value, p.Longitude.Value), 1)
                    : null;

                shelf1.Add(new NearbyPlaceItemDto
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
                    Latitude = p.Latitude,
                    Longitude = p.Longitude,
                    DistanceKm = dist,
                    ExplainReason = $"Địa điểm nổi bật tại {physicalProvinceName}"
                });
                existingIds.Add(p.PlaceId);
                if (shelf1.Count >= 8) break;
            }
        }

        // 3. Shelf 2: Multi-Intent Places (Hỗ trợ 1-3 tỉnh thành kèm Tab Pills)
        var shelf2Groups = new List<IntentDestinationShelfGroupDto>();
        var excludeSet = excludePlaceIds?.ToHashSet() ?? new HashSet<long>();
        // Loại trừ trùng lặp với Kệ 1
        foreach (var p in shelf1)
        {
            excludeSet.Add(p.PlaceId);
        }

        foreach (var provId in effectiveIntentProvinceIds)
        {
            var intentProvincePlaces = await GetTopPlacesByProvinceCachedAsync(provId, ct);
            var provName = catalog.PlacesById.Values.FirstOrDefault(p => p.ProvinceId == provId)?.ProvinceName ?? $"Tỉnh {provId}";
            var label = (provId == effectiveIntentProvinceId && !string.IsNullOrWhiteSpace(effectiveIntentLabel))
                ? effectiveIntentLabel
                : provName;

            var groupPlaces = intentProvincePlaces
                .Where(p => !excludeSet.Contains(p.PlaceId))
                .OrderByDescending(p => topCatSet.Contains(p.CategoryId) ? 1 : 0)
                .ThenByDescending(p => p.AvgRating)
                .ThenByDescending(p => p.ReviewCount)
                .Take(topK)
                .Select(p =>
                {
                    bool isTopCat = topCatSet.Contains(p.CategoryId);
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
                        Latitude = p.Latitude,
                        Longitude = p.Longitude,
                        CosineSimilarity = isTopCat ? 0.95 : 0.85,
                        ExplainReason = isTopCat
                            ? $"Phù hợp với nhóm {p.CategoryName} bạn vừa xem tại {label}"
                            : $"Điểm đến nổi bật tại {label}"
                    };
                })
                .ToList();

            shelf2Groups.Add(new IntentDestinationShelfGroupDto
            {
                ProvinceId = provId,
                ProvinceName = provName,
                IntentLabel = label,
                Places = groupPlaces
            });
        }

        var shelf2 = shelf2Groups.FirstOrDefault()?.Places?.ToList() ?? new List<RecommendedPlaceDto>();

        // 4. Shelf 3: Không còn dùng tại home-feed (đã hợp nhất vào /api/collections/featured)
        var shelf3 = new List<SuggestedTripOrCollectionDto>();

        return new DualContextHomeFeedResponse
        {
            DeviceId = validDeviceId,
            PhysicalProvinceId = physicalProvinceId,
            PhysicalProvinceName = physicalProvinceName,
            GridKey = gridKey,
            IntentProvinceId = effectiveIntentProvinceId,
            IntentProvinceName = effectiveIntentProvinceId.HasValue ? (effectiveIntentLabel ?? (catalog.PlacesById.Values.FirstOrDefault(p => p.ProvinceId == effectiveIntentProvinceId.Value)?.ProvinceName)) : null,
            IntentLabel = effectiveIntentLabel,
            IntentProvinceIds = effectiveIntentProvinceIds,
            TopCategoryIds = effectiveTopCategoryIds,
            Shelf1NearbyPlaces = shelf1,
            Shelf2IntentPlaces = shelf2,
            Shelf2IntentGroups = shelf2Groups,
            Shelf3MixedCollectionsAndTrips = shelf3
        };
    }

    private async Task<List<PlaceFeatureVector>> GetTopPlacesByProvinceCachedAsync(int provinceId, CancellationToken ct)
    {
        string key = $"cache:top_places:province_{provinceId}";
        if (_enterpriseCache != null)
        {
            return await _enterpriseCache.GetOrCreateAsync(
                key,
                async innerCt =>
                {
                    var catalog = await GetOrLoadPlaceCatalogAsync(innerCt);
                    return catalog.PlacesById.Values
                        .Where(p => p.ProvinceId == provinceId)
                        .OrderByDescending(p => p.AvgRating)
                        .ThenByDescending(p => p.ReviewCount)
                        .ToList();
                },
                TimeSpan.FromMinutes(30),
                ct) ?? new List<PlaceFeatureVector>();
        }

        var cat = await GetOrLoadPlaceCatalogAsync(ct);
        return cat.PlacesById.Values
            .Where(p => p.ProvinceId == provinceId)
            .OrderByDescending(p => p.AvgRating)
            .ThenByDescending(p => p.ReviewCount)
            .ToList();
    }

    private async Task<List<SuggestedTripOrCollectionDto>> GetCollectionsAndTripsCachedAsync(int? provinceId, CancellationToken ct)
    {
        string key = provinceId.HasValue
            ? $"cache:collections:province_{provinceId.Value}"
            : "cache:collections:featured_all";

        if (_enterpriseCache != null)
        {
            return await _enterpriseCache.GetOrCreateAsync(
                key,
                async innerCt => await _repo.GetCollectionsAndTripsByProvinceAsync(provinceId, 8, innerCt),
                TimeSpan.FromMinutes(30),
                ct) ?? new List<SuggestedTripOrCollectionDto>();
        }

        return await _repo.GetCollectionsAndTripsByProvinceAsync(provinceId, 8, ct);
    }
}
