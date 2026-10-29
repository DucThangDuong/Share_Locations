using Domain.Enums;

namespace Domain.Entities;

public class Review
{
    public long Id { get; private set; }
    public long PlaceId { get; private set; }
    public long UserId { get; private set; }
    public byte Rating { get; private set; }
    public string? Title { get; private set; }
    public string? Content { get; private set; }
    public DateOnly? VisitDate { get; private set; }
    public int LikesCount { get; private set; } = 0;
    public int CommentsCount { get; private set; } = 0;
    public ReviewStatus Status { get; private set; } = ReviewStatus.Active;
    public string? HiddenReason { get; private set; }
    public long? HiddenBy { get; private set; }
    public DateTime? HiddenAt { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    public virtual Place Place { get; private set; } = null!;
    public virtual User User { get; private set; } = null!;
    public virtual User? HiddenByUser { get; private set; }

    private readonly List<ReviewMedia> _media = new();
    public virtual IReadOnlyCollection<ReviewMedia> Media => _media.AsReadOnly();

    private readonly List<ReviewLike> _likes = new();
    public virtual IReadOnlyCollection<ReviewLike> Likes => _likes.AsReadOnly();

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

    public void Hide(long? hiddenBy = null, string? reason = null)
    {
        Status = ReviewStatus.Hidden;
        HiddenBy = hiddenBy;
        if (!string.IsNullOrWhiteSpace(reason))
        {
            HiddenReason = reason;
        }
        HiddenAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Restore()
    {
        Status = ReviewStatus.Active;
        HiddenReason = null;
        HiddenBy = null;
        HiddenAt = null;
        UpdatedAt = DateTime.UtcNow;
    }

    public void FlagForPendingReview(string reason)
    {
        Status = ReviewStatus.PendingReview;
        HiddenReason = reason;
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateStatus(ReviewStatus status, string? reason = null, long? hiddenBy = null)
    {
        Status = status;
        if (status == ReviewStatus.Active)
        {
            HiddenReason = null;
            HiddenBy = null;
            HiddenAt = null;
        }
        else
        {
            if (!string.IsNullOrWhiteSpace(reason))
            {
                HiddenReason = reason;
            }
            if (hiddenBy.HasValue)
            {
                HiddenBy = hiddenBy.Value;
            }
            if (status == ReviewStatus.Hidden)
            {
                HiddenAt = DateTime.UtcNow;
            }
        }
        UpdatedAt = DateTime.UtcNow;
    }

    public void AddMedia(string url, FoodMediaType mediaType = FoodMediaType.Image)
    {
        if (!string.IsNullOrWhiteSpace(url))
        {
            _media.Add(new ReviewMedia(this, url.Trim(), mediaType));
        }
    }

    public void ClearMedia()
    {
        _media.Clear();
    }

    public void IncrementLikes()
    {
        LikesCount++;
        UpdatedAt = DateTime.UtcNow;
    }

    public void DecrementLikes()
    {
        if (LikesCount > 0)
        {
            LikesCount--;
            UpdatedAt = DateTime.UtcNow;
        }
    }
}
