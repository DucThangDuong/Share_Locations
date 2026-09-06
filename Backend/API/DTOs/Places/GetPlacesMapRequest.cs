namespace API.DTOs.Places;

public class GetPlacesMapRequest
{
    public string? Keyword { get; set; }
    public string? Region { get; set; }
    public int? ProvinceId { get; set; }
    public int? CategoryId { get; set; }
    public double? MinLng { get; set; }
    public double? MinLat { get; set; }
    public double? MaxLng { get; set; }
    public double? MaxLat { get; set; }
}
