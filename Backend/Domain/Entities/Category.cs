using Domain.Enums;

namespace Domain.Entities;

public class Category
{
    public int Id { get; private set; }
    public int PlaceTypeId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string? Slug { get; private set; }
    public string? IconUrl { get; private set; }
    public string? ImageUrl { get; private set; }
    public int DisplayOrder { get; private set; }
    public RecordStatus Status { get; private set; } = RecordStatus.Active;

    // Navigation
    public virtual PlaceType PlaceType { get; private set; } = null!;

    private readonly List<Place> _places = new();
    public virtual IReadOnlyCollection<Place> Places => _places.AsReadOnly();

    private readonly List<Blog> _blogs = new();
    public virtual IReadOnlyCollection<Blog> Blogs => _blogs.AsReadOnly();

    private readonly List<AdminCategoryScope> _adminScopes = new();
    public virtual IReadOnlyCollection<AdminCategoryScope> AdminScopes => _adminScopes.AsReadOnly();

    private readonly List<Proposal> _proposals = new();
    public virtual IReadOnlyCollection<Proposal> Proposals => _proposals.AsReadOnly();
}
