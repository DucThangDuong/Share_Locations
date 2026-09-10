using System.Text.Json.Serialization;

namespace Application.DTOs;

public class RegionLandingDto
{
    [JsonPropertyName("code")]
    public string Code { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("shortTitle")]
    public string ShortTitle { get; set; } = string.Empty;

    [JsonPropertyName("badgeText")]
    public string BadgeText { get; set; } = string.Empty;

    [JsonPropertyName("heroHeadline")]
    public string HeroHeadline { get; set; } = string.Empty;

    [JsonPropertyName("heroSubheadline")]
    public string HeroSubheadline { get; set; } = string.Empty;

    [JsonPropertyName("provinces")]
    public List<string> Provinces { get; set; } = new();

    [JsonPropertyName("heroImages")]
    public List<RegionHeroImageDto> HeroImages { get; set; } = new();

    [JsonPropertyName("collections")]
    public List<RegionCollectionDto> Collections { get; set; } = new();

    [JsonPropertyName("landmarks")]
    public List<RegionLandmarkDto> Landmarks { get; set; } = new();

    [JsonPropertyName("foods")]
    public List<RegionFoodDto> Foods { get; set; } = new();

    [JsonPropertyName("blogPosts")]
    public List<RegionBlogPostDto> BlogPosts { get; set; } = new();

    [JsonPropertyName("spotlight")]
    public RegionSpotlightDto? Spotlight { get; set; }

    [JsonPropertyName("reviews")]
    public List<RegionReviewDto> Reviews { get; set; } = new();
}

public class RegionHeroImageDto
{
    [JsonPropertyName("url")]
    public string Url { get; set; } = string.Empty;

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("location")]
    public string Location { get; set; } = string.Empty;

    [JsonPropertyName("tag")]
    public string Tag { get; set; } = string.Empty;
}

public class RegionCollectionDto
{
    [JsonPropertyName("id")]
    public long Id { get; set; }

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("subtitle")]
    public string? Subtitle { get; set; }

    [JsonPropertyName("placeCount")]
    public int PlaceCount { get; set; }

    [JsonPropertyName("places")]
    public List<PlaceCardDto> Places { get; set; } = new();
}

public class RegionLandmarkDto
{
    [JsonPropertyName("id")]
    public long Id { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("province")]
    public string Province { get; set; } = string.Empty;

    [JsonPropertyName("location")]
    public string Location { get; set; } = string.Empty;

    [JsonPropertyName("coordinates")]
    public double[]? Coordinates { get; set; }

    [JsonPropertyName("rating")]
    public double Rating { get; set; }

    [JsonPropertyName("reviewCount")]
    public int ReviewCount { get; set; }

    [JsonPropertyName("savedCount")]
    public int SavedCount { get; set; }

    [JsonPropertyName("imageUrl")]
    public string? ImageUrl { get; set; }

    [JsonPropertyName("mediaUrls")]
    public List<string> MediaUrls { get; set; } = new();

    [JsonPropertyName("category")]
    public string? Category { get; set; }

    [JsonPropertyName("price")]
    public string? Price { get; set; }
}

public class RegionFoodDto
{
    [JsonPropertyName("id")]
    public long Id { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("province")]
    public string Province { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("imageUrl")]
    public string? ImageUrl { get; set; }

    [JsonPropertyName("mediaUrls")]
    public List<string> MediaUrls { get; set; } = new();

    [JsonPropertyName("type")]
    public string Type { get; set; } = "dine-in";

    [JsonPropertyName("priceRange")]
    public string? PriceRange { get; set; }

    [JsonPropertyName("suggestedPlacesCount")]
    public int SuggestedPlacesCount { get; set; }

    [JsonPropertyName("coordinates")]
    public double[]? Coordinates { get; set; }

    [JsonPropertyName("suggestedPlaces")]
    public List<RegionFoodSuggestedPlaceDto> SuggestedPlaces { get; set; } = new();
}

public class RegionFoodSuggestedPlaceDto
{
    [JsonPropertyName("id")]
    public long Id { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("address")]
    public string Address { get; set; } = string.Empty;

    [JsonPropertyName("rating")]
    public double Rating { get; set; }

    [JsonPropertyName("coordinates")]
    public double[]? Coordinates { get; set; }
}

public class RegionBlogPostDto
{
    [JsonPropertyName("id")]
    public long Id { get; set; }

    [JsonPropertyName("slug")]
    public string Slug { get; set; } = string.Empty;

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("excerpt")]
    public string? Excerpt { get; set; }

    [JsonPropertyName("coverUrl")]
    public string? CoverUrl { get; set; }

    [JsonPropertyName("publishedAt")]
    public string PublishedAt { get; set; } = string.Empty;

    [JsonPropertyName("readTime")]
    public string ReadTime { get; set; } = string.Empty;

    [JsonPropertyName("category")]
    public string Category { get; set; } = string.Empty;

    [JsonPropertyName("location")]
    public string Location { get; set; } = string.Empty;

    [JsonPropertyName("rating")]
    public double Rating { get; set; }

    [JsonPropertyName("reviewCount")]
    public int ReviewCount { get; set; }

    [JsonPropertyName("tags")]
    public List<string> Tags { get; set; } = new();

    [JsonPropertyName("statusOrHours")]
    public string StatusOrHours { get; set; } = string.Empty;

    [JsonPropertyName("author")]
    public RegionBlogAuthorDto Author { get; set; } = new();
}

public class RegionBlogAuthorDto
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("avatar")]
    public string? Avatar { get; set; }
}

public class RegionSpotlightDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("subtitle")]
    public string Subtitle { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("province")]
    public string Province { get; set; } = string.Empty;

    [JsonPropertyName("totalReviews")]
    public int TotalReviews { get; set; }

    [JsonPropertyName("avgRating")]
    public double AvgRating { get; set; }

    [JsonPropertyName("bannerUrl")]
    public string BannerUrl { get; set; } = string.Empty;

    [JsonPropertyName("coordinates")]
    public double[]? Coordinates { get; set; }

    [JsonPropertyName("highlights")]
    public List<string> Highlights { get; set; } = new();
}

public class RegionReviewDto
{
    [JsonPropertyName("id")]
    public long Id { get; set; }

    [JsonPropertyName("reviewerName")]
    public string ReviewerName { get; set; } = string.Empty;

    [JsonPropertyName("reviewerAvatar")]
    public string? ReviewerAvatar { get; set; }

    [JsonPropertyName("rating")]
    public int Rating { get; set; }

    [JsonPropertyName("placeName")]
    public string PlaceName { get; set; } = string.Empty;

    [JsonPropertyName("placeId")]
    public long PlaceId { get; set; }

    [JsonPropertyName("visitDate")]
    public string VisitDate { get; set; } = string.Empty;

    [JsonPropertyName("content")]
    public string Content { get; set; } = string.Empty;

    [JsonPropertyName("images")]
    public List<string> Images { get; set; } = new();

    [JsonPropertyName("likesCount")]
    public int LikesCount { get; set; }

    [JsonPropertyName("coordinates")]
    public double[]? Coordinates { get; set; }
}
