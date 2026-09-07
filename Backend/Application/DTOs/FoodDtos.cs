namespace Application.DTOs;

public class FoodSuggestedPlaceDto
{
    public long? PlaceId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public decimal Rating { get; set; }
    public string Price { get; set; } = string.Empty;
}

public class FoodItemDto
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string PriceRange { get; set; } = string.Empty;
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public string? ImageUrl { get; set; }
    public string? Description { get; set; }
    public IReadOnlyList<FoodSuggestedPlaceDto> SuggestedPlaces { get; set; } = [];
}
