using Domain.Enums;

namespace Domain.Entities;

public class Province
{
    public int Id { get; private set; }
    public int RegionId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string? Slug { get; private set; }
    public string? Tagline { get; private set; }
    public string? Description { get; private set; }
    public string? ImageUrl { get; private set; }
    public bool Featured { get; private set; }
    public int DisplayOrder { get; private set; }
    public RecordStatus Status { get; private set; } = RecordStatus.Active;

    // Navigation
    public virtual Region Region { get; private set; } = null!;

    private readonly List<Place> _places = new();
    public virtual IReadOnlyCollection<Place> Places => _places.AsReadOnly();

    private readonly List<FoodProvince> _foodProvinces = new();
    public virtual IReadOnlyCollection<FoodProvince> FoodProvinces => _foodProvinces.AsReadOnly();

    private readonly List<Collection> _collections = new();
    public virtual IReadOnlyCollection<Collection> Collections => _collections.AsReadOnly();

    private readonly List<AdminProvinceScope> _adminScopes = new();
    public virtual IReadOnlyCollection<AdminProvinceScope> AdminScopes => _adminScopes.AsReadOnly();

    private readonly List<Proposal> _proposals = new();
    public virtual IReadOnlyCollection<Proposal> Proposals => _proposals.AsReadOnly();
}
