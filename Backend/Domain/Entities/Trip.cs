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
}
