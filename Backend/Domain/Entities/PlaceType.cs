using Domain.Enums;

namespace Domain.Entities;

public class PlaceType
{
    public int Id { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string? Slug { get; private set; }
    public string? IconUrl { get; private set; }
    public string? ImageUrl { get; private set; }
    public int DisplayOrder { get; private set; }
    public RecordStatus Status { get; private set; } = RecordStatus.Active;

    // Navigation
    private readonly List<Category> _categories = new();
    public virtual IReadOnlyCollection<Category> Categories => _categories.AsReadOnly();
}
