using Application.DTOs;

namespace Application.Common.Interfaces;

public interface IKnnRecommendationService
{
    List<PlaceRecommendationDto> RecommendPlacesForUser(
        long? userId,
        List<PlaceRecommendationDto> allPlaces,
        List<UserReviewFeatureDto> allReviews,
        int topK = 5);
}
