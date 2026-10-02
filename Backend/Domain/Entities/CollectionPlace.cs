namespace Domain.Entities;

public class CollectionPlace
{
    public int CollectionId { get; private set; }
    public long PlaceId { get; private set; }
    public int DisplayOrder { get; private set; }

    // Navigation
    public virtual Collection Collection { get; private set; } = null!;
    public virtual Place Place { get; private set; } = null!;

    protected CollectionPlace() { }

    public CollectionPlace(int collectionId, long placeId, int displayOrder = 0)
    {
        CollectionId = collectionId;
        PlaceId = placeId;
        DisplayOrder = displayOrder;
    }

    public void UpdateDisplayOrder(int displayOrder)
    {
        DisplayOrder = displayOrder;
    }
}
