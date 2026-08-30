using Domain.Enums;

namespace Domain.Entities;

public class PlaceType
{
    public int Id { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string? IconClass { get; private set; }
    public RecordStatus Status { get; private set; } = RecordStatus.Active;

    // Navigation
    private readonly List<Category> _categories = new();
    public virtual IReadOnlyCollection<Category> Categories => _categories.AsReadOnly();
}
