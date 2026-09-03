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

    protected Place() { }

    public Place(
        int provinceId,
        int categoryId,
        string name,
        string address,
        long? createdBy = null,
        string? description = null,
        decimal? minPrice = null,
        decimal? maxPrice = null,
        string? phone = null,
        string? website = null,
        string? openingHours = null,
        decimal? latitude = null,
        decimal? longitude = null)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Tên địa điểm không được để trống.", nameof(name));
        if (string.IsNullOrWhiteSpace(address))
            throw new ArgumentException("Địa chỉ không được để trống.", nameof(address));
        ValidatePriceRange(minPrice, maxPrice);

        ProvinceId = provinceId;
        CategoryId = categoryId;
        Name = name.Trim();
        Address = address.Trim();
        CreatedBy = createdBy;
        Description = description;
        MinPrice = minPrice;
        MaxPrice = maxPrice;
        Phone = phone;
        Website = website;
        OpeningHours = openingHours;
        Latitude = latitude;
        Longitude = longitude;
        Status = PlaceStatus.Pending;
        CreatedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdatePriceRange(decimal? minPrice, decimal? maxPrice)
    {
        ValidatePriceRange(minPrice, maxPrice);
        MinPrice = minPrice;
        MaxPrice = maxPrice;
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateDetails(
        string name,
        string address,
        int provinceId,
        int categoryId,
        string? description,
        string? phone,
        string? website,
        string? openingHours)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Tên địa điểm không được để trống.", nameof(name));
        if (string.IsNullOrWhiteSpace(address))
            throw new ArgumentException("Địa chỉ không được để trống.", nameof(address));

        Name = name.Trim();
        Address = address.Trim();
        ProvinceId = provinceId;
        CategoryId = categoryId;
        Description = description;
        Phone = phone;
        Website = website;
        OpeningHours = openingHours;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Approve()
    {
        Status = PlaceStatus.Approved;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Reject()
    {
        Status = PlaceStatus.Rejected;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Hide()
    {
        Status = PlaceStatus.Hidden;
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateRating(decimal avgRating, int reviewCount)
    {
        if (avgRating < 0 || avgRating > 5)
            throw new ArgumentOutOfRangeException(nameof(avgRating), "Điểm đánh giá phải từ 0 đến 5.");
        if (reviewCount < 0)
            throw new ArgumentOutOfRangeException(nameof(reviewCount), "Số lượng đánh giá không được âm.");

        AvgRating = avgRating;
        ReviewCount = reviewCount;
        UpdatedAt = DateTime.UtcNow;
    }

    private static void ValidatePriceRange(decimal? minPrice, decimal? maxPrice)
    {
        if (minPrice < 0 || maxPrice < 0)
            throw new ArgumentException("Giá không được là số âm.");
        if (minPrice.HasValue && maxPrice.HasValue && minPrice > maxPrice)
            throw new ArgumentException("Giá tối thiểu không được lớn hơn giá tối đa.");
    }
}
