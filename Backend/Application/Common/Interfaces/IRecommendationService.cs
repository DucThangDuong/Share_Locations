using Application.DTOs;

namespace Application.Common.Interfaces;

public interface IRecommendationService
{
    Task<List<RecommendedPlaceDto>> GetRecommendationsForUserAsync(
        long? userId, int topK = 10, int? filterProvinceId = null, int? filterCategoryId = null, CancellationToken ct = default);

    Task<List<RecommendedPlaceDto>> GetSimilarPlacesAsync(
        long currentPlaceId, int topK = 6, double? maxRadiusKm = null, CancellationToken ct = default);

    Task<List<RecommendedPlaceDto>> GetTripPlaceSuggestionsAsync(
        long tripId, int? overrideProvinceId = null, int topK = 10, CancellationToken ct = default);

    Task<List<RecommendedFoodDto>> GetRecommendedFoodsForUserAsync(
        long? userId, int topK = 8, CancellationToken ct = default);

    Task<PlaceVectorCatalog> RefreshPlaceCatalogCacheAsync(CancellationToken ct = default);
    Task InvalidateUserVectorCacheAsync(long userId, CancellationToken ct = default);
}
