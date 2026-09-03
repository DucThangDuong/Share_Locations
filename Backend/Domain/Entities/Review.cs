using Domain.Enums;

namespace Domain.Entities;

public class Review
{
    public long Id { get; private set; }
    public long PlaceId { get; private set; }
    public long UserId { get; private set; }
    public byte Rating { get; private set; }
    public string? Content { get; private set; }
    public DateOnly? VisitDate { get; private set; }
    public ReviewStatus Status { get; private set; } = ReviewStatus.Active;
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    // Navigation
    public virtual Place Place { get; private set; } = null!;
    public virtual User User { get; private set; } = null!;

    private readonly List<ReviewMedia> _media = new();
    public virtual IReadOnlyCollection<ReviewMedia> Media => _media.AsReadOnly();

    private readonly List<Comment> _comments = new();
    public virtual IReadOnlyCollection<Comment> Comments => _comments.AsReadOnly();

    private readonly List<ReviewReport> _reports = new();
    public virtual IReadOnlyCollection<ReviewReport> Reports => _reports.AsReadOnly();

    protected Review() { }

    public Review(long placeId, long userId, byte rating, string? content = null, DateOnly? visitDate = null)
    {
        if (rating < 1 || rating > 5)
            throw new ArgumentOutOfRangeException(nameof(rating), "Điểm đánh giá phải từ 1 đến 5.");

        PlaceId = placeId;
        UserId = userId;
        Rating = rating;
        Content = content;
        VisitDate = visitDate;
        Status = ReviewStatus.Active;
        CreatedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Update(byte rating, string? content, DateOnly? visitDate)
    {
        if (rating < 1 || rating > 5)
            throw new ArgumentOutOfRangeException(nameof(rating), "Điểm đánh giá phải từ 1 đến 5.");

        Rating = rating;
        Content = content;
        VisitDate = visitDate;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Hide()
    {
        Status = ReviewStatus.Hidden;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Restore()
    {
        Status = ReviewStatus.Active;
        UpdatedAt = DateTime.UtcNow;
    }
}
