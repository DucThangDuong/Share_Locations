using Domain.Enums;

namespace Domain.Entities;

public class FoodMedia
{
    public long Id { get; private set; }
    public long FoodId { get; private set; }
    public FoodMediaType MediaType { get; private set; } = FoodMediaType.Image;
    public string Url { get; private set; } = string.Empty;
    public string? Title { get; private set; }
    public int DisplayOrder { get; private set; }

    // Navigation
    public virtual Food Food { get; private set; } = null!;
}
