using Domain.Enums;

namespace Domain.Entities;

public class VisitLog
{
    public long Id { get; private set; }
    public long UserId { get; private set; }
    public long PlaceId { get; private set; }
    public DateOnly VisitedDate { get; private set; }
    public VisitPrivacy Privacy { get; private set; } = VisitPrivacy.Public;
    public string? Note { get; private set; }
    public byte? Rating { get; private set; }
    public DateTime CreatedAt { get; private set; }

    // Navigation
    public virtual User User { get; private set; } = null!;
    public virtual Place Place { get; private set; } = null!;

    protected VisitLog() { }

    public VisitLog(long userId, long placeId, DateOnly visitedDate, VisitPrivacy privacy = VisitPrivacy.Public, string? note = null, byte? rating = null)
    {
        if (rating.HasValue && (rating.Value < 1 || rating.Value > 5))
            throw new ArgumentOutOfRangeException(nameof(rating), "Điểm đánh giá phải từ 1 đến 5.");

        UserId = userId;
        PlaceId = placeId;
        VisitedDate = visitedDate;
        Privacy = privacy;
        Note = note?.Trim();
        Rating = rating;
        CreatedAt = DateTime.UtcNow;
    }

    public void Update(DateOnly visitedDate, VisitPrivacy privacy, string? note = null, byte? rating = null)
    {
        if (rating.HasValue && (rating.Value < 1 || rating.Value > 5))
            throw new ArgumentOutOfRangeException(nameof(rating), "Điểm đánh giá phải từ 1 đến 5.");

        VisitedDate = visitedDate;
        Privacy = privacy;
        Note = note?.Trim();
        Rating = rating;
    }

    public void UpdatePrivacy(VisitPrivacy privacy)
    {
        Privacy = privacy;
    }
}
