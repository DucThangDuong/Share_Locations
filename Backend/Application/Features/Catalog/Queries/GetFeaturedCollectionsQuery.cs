using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using Application.Services;
using MediatR;

namespace Application.Features.Catalog.Queries;

public record GetFeaturedCollectionsQuery(
    double? Lat = null,
    double? Lng = null,
    IReadOnlyList<int>? IntentProvinceIds = null,
    IReadOnlyList<int>? TopCategoryIds = null,
    int Count = 6
) : IRequest<Result<IReadOnlyList<CollectionDto>>>;

public class GetFeaturedCollectionsQueryHandler : IRequestHandler<GetFeaturedCollectionsQuery, Result<IReadOnlyList<CollectionDto>>>
{
    private readonly ICollectionRepository _collectionRepository;
    private readonly ICacheService _cacheService;

    public GetFeaturedCollectionsQueryHandler(ICollectionRepository collectionRepository, ICacheService cacheService)
    {
        _collectionRepository = collectionRepository;
        _cacheService = cacheService;
    }

    public async Task<Result<IReadOnlyList<CollectionDto>>> Handle(GetFeaturedCollectionsQuery request, CancellationToken ct)
    {
        const int candidatePoolSize = 20;
        const string poolCacheKey = "catalog:collections:featured:pool:v3:20";

        var candidatePool = await _cacheService.GetAsync<IReadOnlyList<CollectionDto>>(poolCacheKey, ct);
        if (candidatePool == null || candidatePool.Count == 0)
        {
            candidatePool = await _collectionRepository.GetFeaturedCollectionsAsync(candidatePoolSize, ct);
            if (candidatePool.Count > 0)
            {
                await _cacheService.SetAsync(poolCacheKey, candidatePool, TimeSpan.FromMinutes(30), ct);
            }
        }

        if (candidatePool == null || candidatePool.Count == 0)
        {
            return Result<IReadOnlyList<CollectionDto>>.Success([]);
        }

        var scored = ScoreAndRankCollections(
            candidatePool,
            request.Lat,
            request.Lng,
            request.IntentProvinceIds,
            request.TopCategoryIds,
            request.Count
        );

        return Result<IReadOnlyList<CollectionDto>>.Success(scored);
    }

    public static IReadOnlyList<CollectionDto> ScoreAndRankCollections(
        IEnumerable<CollectionDto> candidates,
        double? lat,
        double? lng,
        IReadOnlyList<int>? intentProvinceIds,
        IReadOnlyList<int>? topCategoryIds,
        int count)
    {
        var intentList = intentProvinceIds?.Where(id => id > 0).Distinct().Take(3).ToList() ?? [];
        var catSet = topCategoryIds?.Where(id => id > 0).Distinct().Take(3).ToHashSet() ?? [];
        bool hasGps = lat.HasValue && lng.HasValue;

        var rankedList = candidates.Select(col =>
        {
            var places = col.Places ?? [];

            // 1. Calculate Near Score (0.0 to 1.0)
            double nearScore = 0.0;
            double? minDistanceKm = null;
            if (hasGps && places.Count > 0)
            {
                var distances = places
                    .Where(p => p.Latitude.HasValue && p.Longitude.HasValue)
                    .Select(p => KnnMathEngine.ComputeDistanceKm(lat!.Value, lng!.Value, p.Latitude!.Value, p.Longitude!.Value))
                    .ToList();

                if (distances.Count > 0)
                {
                    minDistanceKm = distances.Min();
                    // Linear decay within 50km
                    nearScore = Math.Max(0.0, 1.0 - (minDistanceKm.Value / 50.0));
                }
            }

            // 2. Calculate Intent Score (0.0 to 1.0)
            double intentScore = 0.0;
            string? matchedIntentProvinceName = null;
            if (intentList.Count > 0 && places.Count > 0)
            {
                for (int i = 0; i < intentList.Count; i++)
                {
                    int targetProvId = intentList[i];
                    double weight = i == 0 ? 1.0 : i == 1 ? 0.7 : 0.5;

                    var provPlaces = places.Where(p => p.ProvinceId == targetProvId).ToList();
                    bool colMatchesProv = col.ProvinceId == targetProvId;

                    if (provPlaces.Count > 0 || colMatchesProv)
                    {
                        double ratio = provPlaces.Count > 0 ? (double)provPlaces.Count / places.Count : 0.5;
                        double candidateScore = ratio * weight;
                        if (candidateScore > intentScore)
                        {
                            intentScore = candidateScore;
                            matchedIntentProvinceName = provPlaces.FirstOrDefault()?.ProvinceName ?? col.ProvinceName;
                        }
                    }
                }
            }

            // 3. Calculate Category Score (0.0 to 1.0)
            double catScore = 0.0;
            string? matchedCategoryName = null;
            if (catSet.Count > 0 && places.Count > 0)
            {
                var matchingPlaces = places.Where(p => p.CategoryId.HasValue && catSet.Contains(p.CategoryId.Value)).ToList();
                if (matchingPlaces.Count > 0)
                {
                    catScore = (double)matchingPlaces.Count / places.Count;
                    matchedCategoryName = matchingPlaces.FirstOrDefault()?.CategoryName;
                }
            }

            // 4. Calculate Quality Score (0.0 to 1.0)
            double qualityScore = 0.0;
            if (places.Count > 0)
            {
                qualityScore = (double)places.Average(p => (double)p.AvgRating) / 5.0;
            }

            // Formula: Score = 40*Near + 35*Intent + 20*Category + 5*Quality
            double nearContrib = 40.0 * nearScore;
            double intentContrib = 35.0 * intentScore;
            double catContrib = 20.0 * catScore;
            double qualityContrib = 5.0 * qualityScore;

            double totalScore = nearContrib + intentContrib + catContrib + qualityContrib;

            // Determine MatchReason & MatchLabel
            string matchReason = "featured";
            string matchLabel = "✨ Nổi bật";
            double? finalDistanceKm = null;

            if (nearContrib >= 15.0 && nearContrib >= intentContrib && nearContrib >= catContrib && minDistanceKm.HasValue)
            {
                matchReason = "near";
                finalDistanceKm = Math.Round(minDistanceKm.Value, 1);
                matchLabel = $"📍 Gần bạn · cách {finalDistanceKm} km";
            }
            else if (intentContrib >= 15.0 && intentContrib >= catContrib)
            {
                matchReason = "intent";
                string dest = matchedIntentProvinceName ?? col.ProvinceName ?? "điểm đến";
                matchLabel = $"✈️ Cho chuyến đi {dest}";
            }
            else if (catContrib >= 5.0 && !string.IsNullOrWhiteSpace(matchedCategoryName))
            {
                matchReason = "category";
                matchLabel = $"Đúng gu {matchedCategoryName}";
            }

            // Sort places inside collection: matching categories first, then original order
            IReadOnlyList<PlaceCardDto> sortedPlaces;
            if (catSet.Count > 0)
            {
                sortedPlaces = places
                    .OrderByDescending(p => p.CategoryId.HasValue && catSet.Contains(p.CategoryId.Value) ? 1 : 0)
                    .ThenByDescending(p => p.AvgRating)
                    .ToList();
            }
            else
            {
                sortedPlaces = places.ToList();
            }

            var clonedCol = new CollectionDto
            {
                Id = col.Id,
                ProvinceId = col.ProvinceId,
                ProvinceName = col.ProvinceName,
                Title = col.Title,
                Description = col.Description,
                IsFeatured = col.IsFeatured,
                DisplayOrder = col.DisplayOrder,
                PlaceCount = col.PlaceCount,
                MatchReason = matchReason,
                MatchLabel = matchLabel,
                DistanceKm = finalDistanceKm,
                Places = sortedPlaces
            };

            return new { Collection = clonedCol, Score = totalScore };
        })
        .OrderByDescending(x => x.Score)
        .ThenBy(x => x.Collection.DisplayOrder)
        .Take(count)
        .Select(x => x.Collection)
        .ToList();

        return rankedList;
    }
}
