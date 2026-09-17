namespace Domain.Entities;

public class ReviewLike
{
    public long ReviewId { get; private set; }
    public long UserId { get; private set; }
    public DateTime CreatedAt { get; private set; }

    // Navigation
    public virtual Review Review { get; private set; } = null!;
    public virtual User User { get; private set; } = null!;

    protected ReviewLike() { }

    public ReviewLike(long reviewId, long userId)
    {
        ReviewId = reviewId;
        UserId = userId;
        CreatedAt = DateTime.UtcNow;
    }
}
