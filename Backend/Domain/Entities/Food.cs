using Domain.Enums;

namespace Domain.Entities;

public class Food
{
    public long Id { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public string? HistoryInfo { get; private set; }
    public string? CoverImageUrl { get; private set; }
    public decimal? MinPrice { get; private set; }
    public decimal? MaxPrice { get; private set; }
    public RecordStatus Status { get; private set; } = RecordStatus.Active;
    public DateTime CreatedAt { get; private set; }

    // Navigation
    private readonly List<FoodMedia> _media = new();
    public virtual IReadOnlyCollection<FoodMedia> Media => _media.AsReadOnly();

    private readonly List<FoodPlace> _foodPlaces = new();
    public virtual IReadOnlyCollection<FoodPlace> FoodPlaces => _foodPlaces.AsReadOnly();

    private readonly List<FoodProvince> _foodProvinces = new();
    public virtual IReadOnlyCollection<FoodProvince> FoodProvinces => _foodProvinces.AsReadOnly();

    protected Food() { }

    public Food(
        string name,
        string? description = null,
        string? historyInfo = null,
        string? coverImageUrl = null,
        decimal? minPrice = null,
        decimal? maxPrice = null,
        RecordStatus status = RecordStatus.Active)
    {
        if (minPrice.HasValue && maxPrice.HasValue && minPrice.Value > maxPrice.Value)
            throw new ArgumentException("Giá tối thiểu không được lớn hơn giá tối đa.");

        Name = name.Trim();
        Description = description?.Trim();
        HistoryInfo = historyInfo?.Trim();
        CoverImageUrl = coverImageUrl?.Trim();
        MinPrice = minPrice;
        MaxPrice = maxPrice;
        Status = status;
        CreatedAt = DateTime.UtcNow;
    }

    public void UpdatePrice(decimal? minPrice, decimal? maxPrice)
    {
        if (minPrice.HasValue && maxPrice.HasValue && minPrice.Value > maxPrice.Value)
            throw new ArgumentException("Giá tối thiểu không được lớn hơn giá tối đa.");

        MinPrice = minPrice;
        MaxPrice = maxPrice;
    }
}
