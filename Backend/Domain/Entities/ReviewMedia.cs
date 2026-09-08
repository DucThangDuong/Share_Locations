using Domain.Enums;

namespace Domain.Entities;

public class ReviewMedia
{
    public long Id { get; private set; }
    public long ReviewId { get; private set; }
    public FoodMediaType MediaType { get; private set; } = FoodMediaType.Image;
    public string Url { get; private set; } = string.Empty;
    public DateTime CreatedAt { get; private set; }

    // Navigation
    public virtual Review Review { get; private set; } = null!;

    protected ReviewMedia() { }

    public ReviewMedia(long reviewId, string url, FoodMediaType mediaType = FoodMediaType.Image)
    {
        ReviewId = reviewId;
        Url = url;
        MediaType = mediaType;
        CreatedAt = DateTime.UtcNow;
    }

    public ReviewMedia(Review review, string url, FoodMediaType mediaType = FoodMediaType.Image)
    {
        Review = review;
        ReviewId = review.Id;
        Url = url;
        MediaType = mediaType;
        CreatedAt = DateTime.UtcNow;
    }
}
