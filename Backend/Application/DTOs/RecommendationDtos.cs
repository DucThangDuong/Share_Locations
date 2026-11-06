namespace Application.DTOs;

public class RecommendationOptions
{
    public bool StrictTheoryMode { get; set; } = false;
    public bool UseTimeDecayAndWeights { get; set; } = true;
    public double TimeDecayLambda { get; set; } = 0.005;
    public int PlaceCatalogCacheMinutes { get; set; } = 15;
    public int UserVectorCacheMinutes { get; set; } = 30;
}

public class PlaceFeatureVector
{
    public long PlaceId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? CoverImageUrl { get; set; }
    public string Address { get; set; } = string.Empty;

    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public int PlaceTypeId { get; set; }

    public int ProvinceId { get; set; }
    public string ProvinceName { get; set; } = string.Empty;
    public int RegionId { get; set; }

    public decimal AvgRating { get; set; }
    public int ReviewCount { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }

    public double NormRating { get; set; }
    public double NormReviewCount { get; set; }
    public double VectorNorm { get; set; }
}

public class PlaceVectorCatalog
{
    public int MinReviewCount { get; set; }
    public int MaxReviewCount { get; set; }
    public DateTime ComputedAtUtc { get; set; } = DateTime.UtcNow;
    public Dictionary<long, PlaceFeatureVector> PlacesById { get; set; } = new();
}

public class UserInteractionRecord
{
    public long PlaceId { get; set; }
    public double Weight { get; set; } = 1.0;
    public DateTime InteractedAtUtc { get; set; }
}

public class UserPreferenceVector
{
    public long UserId { get; set; }
    public bool IsColdStart { get; set; }
    public int PositiveSampleCount { get; set; }
    public Dictionary<int, double> CategoryWeights { get; set; } = new();
    public Dictionary<int, double> ProvinceWeights { get; set; } = new();
    public List<int> RecentProvinceIds { get; set; } = new();
    public double PreferredNormRating { get; set; }
    public double PreferredNormReviewCount { get; set; }
    public double VectorNorm { get; set; }
    public HashSet<long> ExcludedPlaceIds { get; set; } = new();
}

public class RecommendedPlaceDto
{
    public long PlaceId { get; set; }
    public long Id => PlaceId;
    public string Name { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? CoverImageUrl { get; set; }
    public string Address { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public int ProvinceId { get; set; }
    public string ProvinceName { get; set; } = string.Empty;
    public decimal AvgRating { get; set; }
    public int ReviewCount { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public double? DistanceKm { get; set; }

    public double CosineSimilarity { get; set; }
    public double KnnDistance => Math.Round(1.0 - CosineSimilarity, 4);
    public double MatchPercentage => Math.Round(CosineSimilarity * 100.0, 1);
    public bool IsColdStartFallback { get; set; }
    public string ExplainReason { get; set; } = string.Empty;
}

public class RecommendedFoodDto
{
    public long FoodId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? CoverImageUrl { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public long MatchedPlaceId { get; set; }
    public string? MatchedPlaceName { get; set; }
    public string? MatchedPlaceAddress { get; set; }
    public decimal? MatchedPlaceRating { get; set; }
    public double PlaceMatchPercentage { get; set; }
}

public class PersonalizedPlacesResponse
{
    public long? UserId { get; set; }
    public bool IsPersonalized { get; set; }
    public int Count { get; set; }
    public IReadOnlyList<RecommendedPlaceDto> Items { get; set; } = [];
}

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
}

public class UserReviewFeatureDto
{
    public long UserId { get; set; }
    public long PlaceId { get; set; }
    public double Rating { get; set; }
}

public class AnonymousSessionProfileDto
{
    public string? CurrentGeohash { get; set; }
    public int? LastIntentProvinceId { get; set; }
    public string? LastIntentProvinceName { get; set; }
    public List<int> IntentProvinceIds { get; set; } = new();
    public List<int> TopCategoryIds { get; set; } = new();
}

public class NearbyPlaceItemDto : RecommendedPlaceDto
{
}

public class IntentDestinationShelfGroupDto
{
    public int ProvinceId { get; set; }
    public string ProvinceName { get; set; } = string.Empty;
    public string IntentLabel { get; set; } = string.Empty;
    public IReadOnlyList<RecommendedPlaceDto> Places { get; set; } = [];
}

public class SuggestedTripOrCollectionDto
{
    public long Id { get; set; }
    public string ItemType { get; set; } = "collection"; // "collection" | "trip"
    public string Title { get; set; } = string.Empty;
    public string? Subtitle { get; set; }
    public string? CoverImageUrl { get; set; }
    public int? ProvinceId { get; set; }
    public string? ProvinceName { get; set; }
    public int PlaceCountOrDays { get; set; }
    public string ContextSource { get; set; } = "intent"; // "intent" | "physical" | "featured"
    public string ActionUrl { get; set; } = string.Empty;
    public IReadOnlyList<PlaceCardDto> Places { get; set; } = [];
}

public class DualContextHomeFeedResponse
{
    public long? UserId { get; set; }
    public bool IsPersonalized { get; set; }
    public string? DeviceId { get; set; }
    public int? PhysicalProvinceId { get; set; }
    public string? PhysicalProvinceName { get; set; }
    public string? GridKey { get; set; }
    public int? IntentProvinceId { get; set; }
    public string? IntentProvinceName { get; set; }
    public string? IntentLabel { get; set; }
    public IReadOnlyList<int> IntentProvinceIds { get; set; } = [];
    public IReadOnlyList<int> TopCategoryIds { get; set; } = [];
    public IReadOnlyList<NearbyPlaceItemDto> Shelf1NearbyPlaces { get; set; } = [];
    public IReadOnlyList<RecommendedPlaceDto> Shelf2IntentPlaces { get; set; } = [];
    public IReadOnlyList<IntentDestinationShelfGroupDto> Shelf2IntentGroups { get; set; } = [];
    public IReadOnlyList<SuggestedTripOrCollectionDto> Shelf3MixedCollectionsAndTrips { get; set; } = [];
}

