using Domain.Enums;

namespace Domain.Entities;

public class ReviewMedia
{
    public long Id { get; private set; }
    public long ReviewId { get; private set; }
    public FoodMediaType MediaType { get; private set; } = FoodMediaType.Image;
    public string Url { get; private set; } = string.Empty;
    public int DisplayOrder { get; private set; }
    public DateTime CreatedAt { get; private set; }

    // Navigation
    public virtual Review Review { get; private set; } = null!;

    protected ReviewMedia() { }

    public ReviewMedia(long reviewId, string url, FoodMediaType mediaType = FoodMediaType.Image, int displayOrder = 0)
    {
        ReviewId = reviewId;
        Url = url;
        MediaType = mediaType;
        DisplayOrder = displayOrder;
        CreatedAt = DateTime.UtcNow;
    }

    public ReviewMedia(Review review, string url, FoodMediaType mediaType = FoodMediaType.Image, int displayOrder = 0)
    {
        Review = review;
        ReviewId = review.Id;
        Url = url;
        MediaType = mediaType;
        DisplayOrder = displayOrder;
        CreatedAt = DateTime.UtcNow;
    }
}
