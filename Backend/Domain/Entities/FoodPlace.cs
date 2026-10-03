namespace Domain.Entities;

public class FoodPlace
{
    public long FoodId { get; private set; }
    public long PlaceId { get; private set; }

    // Navigation
    public virtual Food Food { get; private set; } = null!;
    public virtual Place Place { get; private set; } = null!;

    // Constructors
    protected FoodPlace() { }

    public FoodPlace(long foodId, long placeId)
    {
        FoodId = foodId;
        PlaceId = placeId;
    }
}
