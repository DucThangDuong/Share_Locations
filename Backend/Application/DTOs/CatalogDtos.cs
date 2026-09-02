namespace Application.DTOs;

public class PlaceTypeDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? IconClass { get; set; }
}

public class CategoryDto
{
    public int Id { get; set; }
    public int PlaceTypeId { get; set; }
    public string PlaceTypeName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? IconClass { get; set; }
    public int PlaceCount { get; set; }
}

public class CollectionDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsFeatured { get; set; }
    public int DisplayOrder { get; set; }
    public string? CoverUrl { get; set; }
    public int PlaceCount { get; set; }
    public IReadOnlyList<PlaceSummaryDto>? Places { get; set; }
}
