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
    public string? ProvinceName { get; set; }
    public string Title { get; set; } = string.Empty;
    public bool IsFeatured { get; set; }
    public int DisplayOrder { get; set; }
    public int PlaceCount { get; set; }
    public IReadOnlyList<PlaceCardDto> Places { get; set; } = [];
}

public class AdminCollectionSummaryDto
{
    public int Id { get; set; }
    public int? ProvinceId { get; set; }
    public string? ProvinceName { get; set; }
    public string Title { get; set; } = string.Empty;
    public bool IsFeatured { get; set; }
    public int DisplayOrder { get; set; }
    public int Status { get; set; }
    public int PlaceCount { get; set; }
}

public class AdminCollectionPlaceDetailDto
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? CategoryName { get; set; }
    public string? ProvinceName { get; set; }
    public string? Address { get; set; }
    public decimal AvgRating { get; set; }
    public int ReviewCount { get; set; }
    public int DisplayOrder { get; set; }
    public string? CoverUrl { get; set; }
}

public class AdminCollectionDetailPlacesDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? ProvinceId { get; set; }
    public string? ProvinceName { get; set; }
    public string? CoverUrl { get; set; }
    public bool IsFeatured { get; set; }
    public int DisplayOrder { get; set; }
    public int Status { get; set; }
    public int PlaceCount { get; set; }
    public IReadOnlyList<AdminCollectionPlaceDetailDto> Places { get; set; } = [];
}

public class CollectionPlaceInputDto
{
    public long PlaceId { get; set; }
    public int DisplayOrder { get; set; }
}

public class UpdateCollectionPlacesResultDto
{
    public int CollectionId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? ProvinceId { get; set; }
    public string? ProvinceName { get; set; }
    public int TotalPlaces { get; set; }
    public int AddedCount { get; set; }
    public int UpdatedCount { get; set; }
    public IReadOnlyList<PlaceCardDto> Places { get; set; } = [];
}

public class AdminCollectionCreatedDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public int? ProvinceId { get; set; }
    public string? ProvinceName { get; set; }
    public int PlaceCount { get; set; }
    public int DisplayOrder { get; set; }
    public int Status { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class UpdateCollectionStatusResultDto
{
    public int Id { get; set; }
    public int Status { get; set; }
    public string StatusText { get; set; } = string.Empty;
}
