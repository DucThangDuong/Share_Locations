using Domain.Enums;

namespace Domain.Entities;

public class Collection
{
    public int Id { get; private set; }
    public int? ProvinceId { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public string? CoverImageUrl { get; private set; }
    public bool IsFeatured { get; private set; }
    public int DisplayOrder { get; private set; }
    public RecordStatus Status { get; private set; } = RecordStatus.Active;
    public DateTime CreatedAt { get; private set; }

    // Navigation
    public virtual Province? Province { get; private set; }

    private readonly List<CollectionPlace> _collectionPlaces = new();
    public virtual IReadOnlyCollection<CollectionPlace> CollectionPlaces => _collectionPlaces.AsReadOnly();

    protected Collection() { }

    public Collection(
        string title,
        int? provinceId = null,
        string? description = null,
        string? coverImageUrl = null,
        bool isFeatured = false,
        int displayOrder = 0,
        RecordStatus status = RecordStatus.Active)
    {
        Title = title;
        ProvinceId = provinceId;
        Description = description;
        CoverImageUrl = coverImageUrl;
        IsFeatured = isFeatured;
        DisplayOrder = displayOrder;
        Status = status;
        CreatedAt = DateTime.UtcNow;
    }

    public void UpdateInfo(
        string title,
        int? provinceId,
        string? description,
        string? coverImageUrl,
        bool isFeatured,
        int displayOrder,
        RecordStatus status)
    {
        Title = title;
        ProvinceId = provinceId;
        Description = description;
        CoverImageUrl = coverImageUrl;
        IsFeatured = isFeatured;
        DisplayOrder = displayOrder;
        Status = status;
    }

    public void UpdateStatus(RecordStatus status)
    {
        Status = status;
    }

    public void UpdateDescription(string? description)
    {
        Description = description;
    }

    public void UpdateProvince(int? provinceId)
    {
        ProvinceId = provinceId;
    }

    public void UpdateTitle(string title)
    {
        if (!string.IsNullOrWhiteSpace(title))
        {
            Title = title;
        }
    }
}
