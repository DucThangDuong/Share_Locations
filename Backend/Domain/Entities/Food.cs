using Domain.Enums;

namespace Domain.Entities;

public class Food
{
    public long Id { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public string? HistoryInfo { get; private set; }
    public string? CoverImageUrl { get; private set; }
    public RecordStatus Status { get; private set; } = RecordStatus.Active;
    public DateTime CreatedAt { get; private set; }

    // Navigation
    private readonly List<FoodMedia> _media = new();
    public virtual IReadOnlyCollection<FoodMedia> Media => _media.AsReadOnly();

    private readonly List<FoodPlace> _foodPlaces = new();
    public virtual IReadOnlyCollection<FoodPlace> FoodPlaces => _foodPlaces.AsReadOnly();

    private readonly List<FoodProvince> _foodProvinces = new();
    public virtual IReadOnlyCollection<FoodProvince> FoodProvinces => _foodProvinces.AsReadOnly();

    private readonly List<Message> _messages = new();
    public virtual IReadOnlyCollection<Message> Messages => _messages.AsReadOnly();
}
