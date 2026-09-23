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
    public PlaceStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class PlaceFilterParams
{
    public string? Keyword { get; set; }
    public int? RegionId { get; set; }
    public List<int>? RegionIds { get; set; }
    public int? ProvinceId { get; set; }
    public List<int>? ProvinceIds { get; set; }
    public int? CategoryId { get; set; }
    public List<int>? CategoryIds { get; set; }
    public int? PlaceTypeId { get; set; }
    public List<int>? PlaceTypeIds { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public decimal? MinRating { get; set; }
    public string? SortBy { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 12;

    public List<int> GetEffectiveRegionIds()
    {
        var result = new HashSet<int>();
        if (RegionIds != null)
        {
            foreach (var id in RegionIds) if (id > 0) result.Add(id);
        }
        if (RegionId.HasValue && RegionId.Value > 0)
        {
            result.Add(RegionId.Value);
        }
        return result.ToList();
    }

    public List<int> GetEffectiveProvinceIds()
    {
        var result = new HashSet<int>();
        if (ProvinceIds != null)
        {
            foreach (var id in ProvinceIds) if (id > 0) result.Add(id);
        }
        if (ProvinceId.HasValue && ProvinceId.Value > 0)
        {
            result.Add(ProvinceId.Value);
        }
        return result.ToList();
    }

    public List<int> GetEffectiveCategoryIds()
    {
        var result = new HashSet<int>();
        if (CategoryIds != null)
        {
            foreach (var id in CategoryIds) if (id > 0) result.Add(id);
        }
        if (CategoryId.HasValue && CategoryId.Value > 0)
        {
            result.Add(CategoryId.Value);
        }
        return result.ToList();
    }

    public List<int> GetEffectivePlaceTypeIds()
    {
        var result = new HashSet<int>();
        if (PlaceTypeIds != null)
        {
            foreach (var id in PlaceTypeIds) if (id > 0) result.Add(id);
        }
        if (PlaceTypeId.HasValue && PlaceTypeId.Value > 0)
        {
            result.Add(PlaceTypeId.Value);
        }
        return result.ToList();
    }
}
