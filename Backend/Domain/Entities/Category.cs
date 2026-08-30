using Domain.Enums;

namespace Domain.Entities;

public class Category
{
    public int Id { get; private set; }
    public int PlaceTypeId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string? IconClass { get; private set; }
    public RecordStatus Status { get; private set; } = RecordStatus.Active;

    // Navigation
    public virtual PlaceType PlaceType { get; private set; } = null!;

    private readonly List<Place> _places = new();
    public virtual IReadOnlyCollection<Place> Places => _places.AsReadOnly();

    private readonly List<Blog> _blogs = new();
    public virtual IReadOnlyCollection<Blog> Blogs => _blogs.AsReadOnly();
}
