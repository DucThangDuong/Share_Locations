using Domain.Enums;

namespace Application.DTOs;

public class LookupItemDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
}

public class RegionLookupDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public IReadOnlyList<LookupItemDto> Provinces { get; set; } = [];
}

public class PlaceFilterOptionsDto
{
    public IReadOnlyList<LookupItemDto> Categories { get; set; } = [];
    public IReadOnlyList<RegionLookupDto> Regions { get; set; } = [];
}

public class PlaceSummaryDto
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
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
    public IReadOnlyList<string>? MediaUrls { get; set; }
    public PlaceStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class PlaceFilterParams
{
    public string? Keyword { get; set; }
    public int? RegionId { get; set; }
    public int? ProvinceId { get; set; }
    public int? CategoryId { get; set; }
    public int? PlaceTypeId { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public decimal? MinRating { get; set; }
    public string? SortBy { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 12;
}
