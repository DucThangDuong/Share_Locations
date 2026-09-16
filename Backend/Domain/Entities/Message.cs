using Domain.Enums;

namespace Domain.Entities;

public class Message
{
    public long Id { get; private set; }
    public long ChatRoomId { get; private set; }
    public long SenderId { get; private set; }
    public string? Content { get; private set; }
    public ChatMessageType MessageType { get; private set; } = ChatMessageType.TextLink;
    public string? MediaUrl { get; private set; }
    public DateTime CreatedAt { get; private set; }

    // Navigation
    public virtual ChatRoom ChatRoom { get; private set; } = null!;
    public virtual User Sender { get; private set; } = null!;

    protected Message() { }

    public Message(
        long chatRoomId,
        long senderId,
        string? content,
        ChatMessageType messageType = ChatMessageType.TextLink,
        string? mediaUrl = null)
    {
        ChatRoomId = chatRoomId;
        SenderId = senderId;
        Content = content;
        MessageType = messageType;
        MediaUrl = mediaUrl?.Trim();
        CreatedAt = DateTime.UtcNow;
    }
}
