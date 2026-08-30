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
}
