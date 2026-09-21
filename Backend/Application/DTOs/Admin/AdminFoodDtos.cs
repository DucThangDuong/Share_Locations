namespace Application.DTOs.Admin;

public class AdminFoodItemDto
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Province { get; set; }
    public int? ProvinceId { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public string? CoverImg { get; set; }
    public string? Desc { get; set; }
    public string Status { get; set; } = "active"; // "active" | "hidden"
    public int StatusNum => Status == "active" ? 1 : 0;
    public int PlacesCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateAdminFoodInput
{
    public string Name { get; set; } = string.Empty;
    public int? ProvinceId { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public string? CoverImg { get; set; }
    public string? Desc { get; set; }
    public string? HistoryInfo { get; set; }
    public string Status { get; set; } = "active";
}

public class UpdateAdminFoodInput
{
    public string Name { get; set; } = string.Empty;
    public int? ProvinceId { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public string? CoverImg { get; set; }
    public string? Desc { get; set; }
    public string? HistoryInfo { get; set; }
    public string Status { get; set; } = "active";
}
