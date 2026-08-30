namespace Domain.Entities;

public class Message
{
    public long Id { get; private set; }
    public long ChatRoomId { get; private set; }
    public long SenderId { get; private set; }
    public string? Content { get; private set; }
    public long? AttachedPlaceId { get; private set; }
    public long? AttachedFoodId { get; private set; }
    public long? AttachedTripId { get; private set; }
    public DateTime CreatedAt { get; private set; }

    // Navigation
    public virtual ChatRoom ChatRoom { get; private set; } = null!;
    public virtual User Sender { get; private set; } = null!;
    public virtual Place? AttachedPlace { get; private set; }
    public virtual Food? AttachedFood { get; private set; }
    public virtual Trip? AttachedTrip { get; private set; }
}
