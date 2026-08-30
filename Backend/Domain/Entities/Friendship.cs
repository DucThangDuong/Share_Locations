using Domain.Enums;

namespace Domain.Entities;

public class Friendship
{
    public long User1Id { get; private set; }
    public long User2Id { get; private set; }
    public FriendshipStatus Status { get; private set; } = FriendshipStatus.Pending;
    public long ActionUserId { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    // Navigation
    public virtual User User1 { get; private set; } = null!;
    public virtual User User2 { get; private set; } = null!;
    public virtual User ActionUser { get; private set; } = null!;
}
