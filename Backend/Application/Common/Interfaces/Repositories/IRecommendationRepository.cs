using Application.DTOs;

namespace Application.Common.Interfaces.Repositories;

public interface IRecommendationRepository
{
    Task<List<PlaceFeatureVector>> GetAllActivePlacesAsync(CancellationToken ct = default);
    Task<List<UserInteractionRecord>> GetPositiveReviewsStrictAsync(long userId, CancellationToken ct = default);
    Task<List<UserInteractionRecord>> GetHybridPositiveInteractionsAsync(long userId, CancellationToken ct = default);
    Task<HashSet<long>> GetUserExcludedPlaceIdsAsync(long userId, bool strictMode, CancellationToken ct = default);
    Task<(int? TargetProvinceId, List<long> MemberUserIds, HashSet<long> ExistingTripPlaceIds)> GetTripContextAsync(long tripId, CancellationToken ct = default);
    Task<List<RecommendedFoodDto>> GetFoodsByTopPlacesAsync(Dictionary<long, double> placeMatchScores, int topK, CancellationToken ct = default);
    Task SaveUserPreferenceSnapshotAsync(UserPreferenceVector vector, string jsonPayload, CancellationToken ct = default);
    Task<List<PlaceRecommendationDto>> GetAllCandidatePlacesAsync(CancellationToken ct = default);
    Task<List<UserReviewFeatureDto>> GetAllReviewsAsync(CancellationToken ct = default);
}
