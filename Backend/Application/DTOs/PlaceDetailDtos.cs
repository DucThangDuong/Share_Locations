namespace Application.DTOs;

public class PlaceAmenityDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
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
    public string? ThumbnailUrl { get; set; }
    public IReadOnlyList<string> MediaUrls { get; set; } = [];
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Website { get; set; }
    public string? Email { get; set; }
    public IReadOnlyList<string> Highlights { get; set; } = [];
    public IReadOnlyList<PlaceAmenityDto> Amenities { get; set; } = [];
    public int Status { get; set; } = 1;
    public DateTime CreatedAt { get; set; }
}
