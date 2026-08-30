namespace Domain.Entities;

public class ChatRoom
{
    public long Id { get; private set; }
    public string? Name { get; private set; }
    public bool IsGroup { get; private set; }
    public DateTime CreatedAt { get; private set; }

    // Navigation
    private readonly List<ChatRoomMember> _members = new();
    public virtual IReadOnlyCollection<ChatRoomMember> Members => _members.AsReadOnly();

    private readonly List<Message> _messages = new();
    public virtual IReadOnlyCollection<Message> Messages => _messages.AsReadOnly();
}
