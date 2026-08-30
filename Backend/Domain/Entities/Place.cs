using Domain.Enums;

namespace Domain.Entities;

public class Place
{
    public long Id { get; private set; }
    public int ProvinceId { get; private set; }
    public int CategoryId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public string Address { get; private set; } = string.Empty;
    public string? Phone { get; private set; }
    public string? Website { get; private set; }
    public decimal? MinPrice { get; private set; }
    public decimal? MaxPrice { get; private set; }
    public string? OpeningHours { get; private set; }
    public decimal? Latitude { get; private set; }
    public decimal? Longitude { get; private set; }
    public decimal AvgRating { get; private set; }
    public int ReviewCount { get; private set; }
    public PlaceStatus Status { get; private set; } = PlaceStatus.Pending;
    public long? CreatedBy { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    // Navigation
    public virtual Province Province { get; private set; } = null!;
    public virtual Category Category { get; private set; } = null!;
    public virtual User? Creator { get; private set; }

    private readonly List<PlaceMedia> _media = new();
    public virtual IReadOnlyCollection<PlaceMedia> Media => _media.AsReadOnly();

    private readonly List<CollectionPlace> _collectionPlaces = new();
    public virtual IReadOnlyCollection<CollectionPlace> CollectionPlaces => _collectionPlaces.AsReadOnly();

    private readonly List<FoodPlace> _foodPlaces = new();
    public virtual IReadOnlyCollection<FoodPlace> FoodPlaces => _foodPlaces.AsReadOnly();

    private readonly List<TripPlace> _tripPlaces = new();
    public virtual IReadOnlyCollection<TripPlace> TripPlaces => _tripPlaces.AsReadOnly();

    private readonly List<Review> _reviews = new();
    public virtual IReadOnlyCollection<Review> Reviews => _reviews.AsReadOnly();

    private readonly List<Proposal> _proposals = new();
    public virtual IReadOnlyCollection<Proposal> Proposals => _proposals.AsReadOnly();

    private readonly List<Message> _messages = new();
    public virtual IReadOnlyCollection<Message> Messages => _messages.AsReadOnly();

    private readonly List<VisitLog> _visitLogs = new();
    public virtual IReadOnlyCollection<VisitLog> VisitLogs => _visitLogs.AsReadOnly();

    private readonly List<AccessHistory> _accessHistories = new();
    public virtual IReadOnlyCollection<AccessHistory> AccessHistories => _accessHistories.AsReadOnly();

    private readonly List<PlaceReport> _reports = new();
    public virtual IReadOnlyCollection<PlaceReport> Reports => _reports.AsReadOnly();
}
