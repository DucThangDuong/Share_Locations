namespace Domain.Entities;

public class ChatRoomMember
{
    public long ChatRoomId { get; private set; }
    public long UserId { get; private set; }
    public DateTime JoinedAt { get; private set; }
    public DateTime? LastReadAt { get; private set; }

    // Navigation
    public virtual ChatRoom ChatRoom { get; private set; } = null!;
    public virtual User User { get; private set; } = null!;
}
