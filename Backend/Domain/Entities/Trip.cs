using Domain.Enums;

namespace Domain.Entities;

public class Trip
{
    public long Id { get; private set; }
    public long UserId { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public string? CoverImageUrl { get; private set; }
    public DateOnly? StartDate { get; private set; }
    public DateOnly? EndDate { get; private set; }
    public TripPrivacy Privacy { get; private set; } = TripPrivacy.Private;
    public TripStatus Status { get; private set; } = TripStatus.Planning;
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    // Navigation
    public virtual User User { get; private set; } = null!;

    private readonly List<TripDay> _days = new();
    public virtual IReadOnlyCollection<TripDay> Days => _days.AsReadOnly();

    private readonly List<Message> _messages = new();
    public virtual IReadOnlyCollection<Message> Messages => _messages.AsReadOnly();

    protected Trip() { }

    public Trip(long userId, string title, string? description = null, TripPrivacy privacy = TripPrivacy.Private, DateOnly? startDate = null, DateOnly? endDate = null)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("Tiêu đề chuyến đi không được để trống.", nameof(title));
        if (startDate.HasValue && endDate.HasValue && startDate > endDate)
            throw new ArgumentException("Ngày bắt đầu không được sau ngày kết thúc.");

        UserId = userId;
        Title = title.Trim();
        Description = description;
        Privacy = privacy;
        StartDate = startDate;
        EndDate = endDate;
        Status = TripStatus.Planning;
        CreatedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateInfo(string title, string? description, string? coverImageUrl)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("Tiêu đề chuyến đi không được để trống.", nameof(title));

        Title = title.Trim();
        Description = description;
        CoverImageUrl = coverImageUrl;
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateDates(DateOnly? startDate, DateOnly? endDate)
    {
        if (startDate.HasValue && endDate.HasValue && startDate > endDate)
            throw new ArgumentException("Ngày bắt đầu không được sau ngày kết thúc.");

        StartDate = startDate;
        EndDate = endDate;
        UpdatedAt = DateTime.UtcNow;
    }

    public void ChangePrivacy(TripPrivacy privacy)
    {
        Privacy = privacy;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Start()
    {
        Status = TripStatus.Ongoing;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Complete()
    {
        Status = TripStatus.Completed;
        UpdatedAt = DateTime.UtcNow;
    }
}
