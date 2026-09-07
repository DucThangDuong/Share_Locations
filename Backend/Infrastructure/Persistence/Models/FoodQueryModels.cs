namespace Infrastructure.Persistence.Models;

internal sealed class RawFoodRow
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
}

internal sealed class RawSuggestedPlace
{
    public long FoodId { get; set; }
    public long PlaceId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public decimal Rating { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
}
