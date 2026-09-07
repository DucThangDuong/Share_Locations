namespace Application.DTOs;

public class PlaceTypeDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public string? IconClass { get => ImageUrl; set => ImageUrl = value; }
}

public class PlaceCardDto
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? CategoryName { get; set; }
    public decimal AvgRating { get; set; }
    public int ReviewCount { get; set; }
    public IReadOnlyList<string> MediaUrls { get; set; } = [];
}


public class CollectionDto
{
    public int Id { get; set; }
    public int? ProvinceId { get; set; }
    public string Title { get; set; } = string.Empty;
    public bool IsFeatured { get; set; }
    public int DisplayOrder { get; set; }
    public int PlaceCount { get; set; }
    public IReadOnlyList<PlaceCardDto> Places { get; set; } = [];
}
