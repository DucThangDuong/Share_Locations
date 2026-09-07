namespace Infrastructure.Persistence.Models;

internal sealed class RawPlaceMapRow
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public string Region { get; set; } = string.Empty;
    public string RegionName { get; set; } = string.Empty;
    public string Province { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public decimal AvgRating { get; set; }
    public int ReviewCount { get; set; }
    public string Price { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public decimal? Longitude { get; set; }
    public decimal? Latitude { get; set; }
}
