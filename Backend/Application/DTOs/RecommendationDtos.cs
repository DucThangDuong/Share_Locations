namespace Application.DTOs;

public class PlaceRecommendationDto
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public int ProvinceId { get; set; }
    public string? ProvinceName { get; set; }
    public string? CoverImageUrl { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public decimal AvgRating { get; set; }
    public int ReviewCount { get; set; }
    public double MatchPercentage { get; set; }

    public double[] ToFeatureVector(
        IReadOnlyList<int> allCategoryIds,
        IReadOnlyList<int> allProvinceIds,
        double minReviewCount,
        double maxReviewCount)
    {
        var categoryVector = allCategoryIds.Select(id => id == CategoryId ? 1.0 : 0.0);

        var provinceVector = allProvinceIds.Select(id => id == ProvinceId ? 1.0 : 0.0);

        double normalizedRating = ((double)AvgRating - 1.0) / (5.0 - 1.0);
        normalizedRating = Math.Clamp(normalizedRating, 0.0, 1.0);

        double normalizedReviewCount = maxReviewCount > minReviewCount
            ? (ReviewCount - minReviewCount) / (maxReviewCount - minReviewCount)
            : 0.0;
        normalizedReviewCount = Math.Clamp(normalizedReviewCount, 0.0, 1.0);

        return categoryVector
            .Concat(provinceVector)
            .Concat(new[] { normalizedRating, normalizedReviewCount })
            .ToArray();
    }
}

public class UserReviewFeatureDto
{
    public long UserId { get; set; }
    public long PlaceId { get; set; }
    public double Rating { get; set; }
}
