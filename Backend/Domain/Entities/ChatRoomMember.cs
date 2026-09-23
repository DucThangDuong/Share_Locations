namespace Domain.Entities;

public class ChatRoomMember
{
    public long ChatRoomId { get; private set; }
    public long UserId { get; private set; }
    public ChatMemberRole Role { get; private set; } = ChatMemberRole.Member;
    public DateTime JoinedAt { get; private set; }
    public DateTime? LastReadAt { get; private set; }

    // Navigation
    public virtual ChatRoom ChatRoom { get; private set; } = null!;
    public virtual User User { get; private set; } = null!;

    protected ChatRoomMember() { }

    public ChatRoomMember(long chatRoomId, long userId, ChatMemberRole role = ChatMemberRole.Member)
    {
        ChatRoomId = chatRoomId;
        UserId = userId;
        Role = role;
        JoinedAt = DateTime.UtcNow;
        LastReadAt = DateTime.UtcNow;
    }

    public void SetRole(ChatMemberRole role)
    {
        Role = role;
    }

    public void MarkRead(DateTime readAt)
    {
        LastReadAt = readAt;
    }
}
