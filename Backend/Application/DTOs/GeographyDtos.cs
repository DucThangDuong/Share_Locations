namespace Application.DTOs;

public class RegionDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Tagline { get; set; }
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public int OrderIndex { get; set; }
    public int ProvinceCount { get; set; }
    public IReadOnlyList<ProvinceSummaryDto>? Provinces { get; set; }
}

public class ProvinceDto
{
    public int Id { get; set; }
    public int RegionId { get; set; }
    public string RegionName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Tagline { get; set; }
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public bool Featured { get; set; }
    public int DisplayOrder { get; set; }
    public int PlaceCount { get; set; }
}

public class ProvinceSummaryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public bool Featured { get; set; }
    public int PlaceCount { get; set; }
}
