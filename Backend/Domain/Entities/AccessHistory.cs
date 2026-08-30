namespace Domain.Entities;

public class AccessHistory
{
    public long Id { get; private set; }
    public long UserId { get; private set; }
    public long PlaceId { get; private set; }
    public DateTime ViewedAt { get; private set; }

    // Navigation
    public virtual User User { get; private set; } = null!;
    public virtual Place Place { get; private set; } = null!;
}
