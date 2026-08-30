using Domain.Enums;

namespace Domain.Entities;

public class Collection
{
    public int Id { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public bool IsFeatured { get; private set; }
    public int DisplayOrder { get; private set; }
    public RecordStatus Status { get; private set; } = RecordStatus.Active;
    public DateTime CreatedAt { get; private set; }

    // Navigation
    private readonly List<CollectionPlace> _collectionPlaces = new();
    public virtual IReadOnlyCollection<CollectionPlace> CollectionPlaces => _collectionPlaces.AsReadOnly();
}
