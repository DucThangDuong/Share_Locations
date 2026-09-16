using System.Text.Json.Serialization;

namespace Application.DTOs;

public class ProvinceLandingDto
{
    [JsonPropertyName("province")]
    public ProvinceDto Province { get; set; } = null!;

    [JsonPropertyName("heroHeadline")]
    public string HeroHeadline { get; set; } = string.Empty;

    [JsonPropertyName("heroSubheadline")]
    public string HeroSubheadline { get; set; } = string.Empty;

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

    [JsonPropertyName("itineraries")]
    public List<ItineraryDto> Itineraries { get; set; } = new();

    [JsonPropertyName("spotlight")]
    public RegionSpotlightDto? Spotlight { get; set; }

    [JsonPropertyName("reviews")]
    public List<RegionReviewDto> Reviews { get; set; } = new();
}