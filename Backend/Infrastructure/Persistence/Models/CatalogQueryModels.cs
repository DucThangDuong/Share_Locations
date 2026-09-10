using Application.DTOs;

namespace Infrastructure.Persistence.Models;

internal sealed class PlaceInCollectionRaw
{
    public int CollectionId { get; set; }
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? CategoryName { get; set; }
    public decimal AvgRating { get; set; }
    public int ReviewCount { get; set; }
    public string? CoverImageUrl { get; set; }
}

internal sealed class PlaceInCategoryRaw
{
    public int CategoryId { get; set; }
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal AvgRating { get; set; }
    public int ReviewCount { get; set; }
}

internal sealed class PlaceMediaRaw
{
    public long PlaceId { get; set; }
    public string Url { get; set; } = string.Empty;
}

internal sealed class ProvinceWithRegionRaw : ProvinceSummaryDto
{
    public int RegionId { get; set; }
}
