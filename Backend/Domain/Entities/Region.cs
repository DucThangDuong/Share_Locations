using Domain.Enums;

namespace Domain.Entities;

public class Region
{
    public int Id { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string? Tagline { get; private set; }
    public string? Description { get; private set; }
    public string? ImageUrl { get; private set; }
    public int OrderIndex { get; private set; }
    public RecordStatus Status { get; private set; } = RecordStatus.Active;

    // Navigation
    private readonly List<Province> _provinces = new();
    public virtual IReadOnlyCollection<Province> Provinces => _provinces.AsReadOnly();
}
