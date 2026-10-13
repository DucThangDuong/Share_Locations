using Application.DTOs;

namespace Application.Common.Interfaces.Repositories;

public interface IRecommendationRepository
{
    Task<List<PlaceRecommendationDto>> GetAllCandidatePlacesAsync(CancellationToken ct = default);
    Task<List<UserReviewFeatureDto>> GetAllReviewsAsync(CancellationToken ct = default);
}
