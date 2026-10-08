namespace Application.DTOs;

public class PlaceFoodDto
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public string? PriceRange { get; set; }
    public string? ImageUrl { get; set; }
    public string? CoverImageUrl
    {
        get => ImageUrl;
        set => ImageUrl = value;
    }
    public string? CoverImg
    {
        get => ImageUrl;
        set => ImageUrl = value;
    }
    public IReadOnlyList<string> MediaUrls { get; set; } = [];
    public IReadOnlyList<string> Photos
    {
        get => MediaUrls;
        set => MediaUrls = value;
    }
    public IReadOnlyList<string> Images
    {
        get => MediaUrls;
        set => MediaUrls = value;
    }
}

public class PlaceDetailDto
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? DetailedDescription { get; set; }
    public string Address { get; set; } = string.Empty;
    public int ProvinceId { get; set; }
    public string ProvinceName { get; set; } = string.Empty;
    public int RegionId { get; set; }
    public string RegionName { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public int PlaceTypeId { get; set; }
    public string PlaceTypeName { get; set; } = string.Empty;
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public string? OpeningHours { get; set; }
    public decimal AvgRating { get; set; }
    public int ReviewCount { get; set; }
    public int ViewCount { get; set; }
    public string? ThumbnailUrl { get; set; }
    public IReadOnlyList<string> MediaUrls { get; set; } = [];
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Website { get; set; }
    public string? Email { get; set; }
    public IReadOnlyList<string> Highlights { get; set; } = [];
    public int Status { get; set; } = 1;
    public DateTime CreatedAt { get; set; }
    public bool IsSaved { get; set; }
    public bool IsVisited { get; set; }
    public bool IsCheckedIn => IsVisited;
    public IReadOnlyList<PlaceFoodDto> Foods { get; set; } = [];
}
