using Application.Common.Interfaces;
using Application.DTOs;

namespace Application.Services;

public class KnnRecommendationService : IKnnRecommendationService
{
    public List<PlaceRecommendationDto> RecommendPlacesForUser(
        long? userId,
        List<PlaceRecommendationDto> allPlaces,
        List<UserReviewFeatureDto> allReviews,
        int topK = 5)
    {
        if (allPlaces == null || allPlaces.Count == 0)
            return new List<PlaceRecommendationDto>();

        if (topK <= 0) topK = 5;

        var allCategoryIds = allPlaces.Select(p => p.CategoryId).Distinct().OrderBy(id => id).ToList();
        var allProvinceIds = allPlaces.Select(p => p.ProvinceId).Distinct().OrderBy(id => id).ToList();

        double minReviewCount = allPlaces.Min(p => p.ReviewCount);
        double maxReviewCount = allPlaces.Max(p => p.ReviewCount);

        if (!userId.HasValue)
        {
            return GetColdStartRecommendations(allPlaces, topK);
        }

        var userLikedReviews = allReviews
            .Where(r => r.UserId == userId.Value && r.Rating >= 4.0)
            .ToList();

        if (!userLikedReviews.Any())
        {
            return GetColdStartRecommendations(allPlaces, topK);
        }

        var likedPlaceIds = userLikedReviews.Select(r => r.PlaceId).ToHashSet();
        var likedPlaces = allPlaces.Where(p => likedPlaceIds.Contains(p.Id)).ToList();

        if (!likedPlaces.Any())
        {
            return GetColdStartRecommendations(allPlaces, topK);
        }

        var likedVectors = likedPlaces
            .Select(p => p.ToFeatureVector(allCategoryIds, allProvinceIds, minReviewCount, maxReviewCount))
            .ToList();

        double[] userVector = CalculateAverageVector(likedVectors);

        var reviewedPlaceIds = allReviews
            .Where(r => r.UserId == userId.Value)
            .Select(r => r.PlaceId)
            .ToHashSet();

        var candidatePlaces = allPlaces.Where(p => !reviewedPlaceIds.Contains(p.Id)).ToList();

        if (!candidatePlaces.Any())
        {
            candidatePlaces = allPlaces;
        }

        var recommendations = candidatePlaces
            .Select(place =>
            {
                var placeVector = place.ToFeatureVector(allCategoryIds, allProvinceIds, minReviewCount, maxReviewCount);
                double distance = CosineDistance(userVector, placeVector);
                double matchPercentage = Math.Max(0, (1.0 - distance) * 100.0);

                return new PlaceRecommendationDto
                {
                    Id = place.Id,
                    Name = place.Name,
                    Address = place.Address,
                    CategoryId = place.CategoryId,
                    CategoryName = place.CategoryName,
                    ProvinceId = place.ProvinceId,
                    ProvinceName = place.ProvinceName,
                    CoverImageUrl = place.CoverImageUrl,
                    MinPrice = place.MinPrice,
                    MaxPrice = place.MaxPrice,
                    AvgRating = place.AvgRating,
                    ReviewCount = place.ReviewCount,
                    MatchPercentage = Math.Round(matchPercentage, 2)
                };
            })
            .OrderByDescending(r => r.MatchPercentage)
            .ThenByDescending(r => r.AvgRating)
            .ThenByDescending(r => r.ReviewCount)
            .Take(topK)
            .ToList();

        return recommendations;
    }

    private static List<PlaceRecommendationDto> GetColdStartRecommendations(List<PlaceRecommendationDto> allPlaces, int topK)
    {
        return allPlaces
            .OrderByDescending(p => p.AvgRating)
            .ThenByDescending(p => p.ReviewCount)
            .Take(topK)
            .Select(p => new PlaceRecommendationDto
            {
                Id = p.Id,
                Name = p.Name,
                Address = p.Address,
                CategoryId = p.CategoryId,
                CategoryName = p.CategoryName,
                ProvinceId = p.ProvinceId,
                ProvinceName = p.ProvinceName,
                CoverImageUrl = p.CoverImageUrl,
                MinPrice = p.MinPrice,
                MaxPrice = p.MaxPrice,
                AvgRating = p.AvgRating,
                ReviewCount = p.ReviewCount,
                MatchPercentage = 100.0
            })
            .ToList();
    }

    private static double[] CalculateAverageVector(List<double[]> vectors)
    {
        if (vectors.Count == 0) return Array.Empty<double>();

        int dimension = vectors[0].Length;
        double[] avg = new double[dimension];

        foreach (var vec in vectors)
        {
            for (int i = 0; i < dimension; i++)
            {
                avg[i] += vec[i];
            }
        }

        for (int i = 0; i < dimension; i++)
        {
            avg[i] /= vectors.Count;
        }

        return avg;
    }

    private static double CosineDistance(double[] v1, double[] v2)
    {
        double dotProduct = 0.0;
        double mag1 = 0.0;
        double mag2 = 0.0;

        for (int i = 0; i < v1.Length; i++)
        {
            dotProduct += v1[i] * v2[i];
            mag1 += Math.Pow(v1[i], 2);
            mag2 += Math.Pow(v2[i], 2);
        }

        mag1 = Math.Sqrt(mag1);
        mag2 = Math.Sqrt(mag2);

        if (mag1 == 0 || mag2 == 0) return 1.0;

        double similarity = dotProduct / (mag1 * mag2);
        if (similarity > 1.0) similarity = 1.0;
        if (similarity < -1.0) similarity = -1.0;

        return 1.0 - similarity;
    }
}
