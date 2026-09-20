namespace Domain.Entities;

public class Message
{
    public long Id { get; private set; }
    public long ChatRoomId { get; private set; }
    public long SenderId { get; private set; }
    public string? Content { get; private set; }
    public long? ReplyToMessageId { get; private set; }
    public DateTime CreatedAt { get; private set; }

    // Navigation
    public virtual ChatRoom ChatRoom { get; private set; } = null!;
    public virtual User Sender { get; private set; } = null!;
    public virtual Message? ReplyToMessage { get; private set; }

    private readonly List<MessageAttachment> _attachments = new();
    public virtual IReadOnlyCollection<MessageAttachment> Attachments => _attachments.AsReadOnly();

    private readonly List<MessageReaction> _reactions = new();
    public virtual IReadOnlyCollection<MessageReaction> Reactions => _reactions.AsReadOnly();

    protected Message() { }

    public Message(
        long chatRoomId,
        long senderId,
        string? content,
        long? replyToMessageId = null)
    {
        ChatRoomId = chatRoomId;
        SenderId = senderId;
        Content = content;
        ReplyToMessageId = replyToMessageId;
        CreatedAt = DateTime.UtcNow;
    }

    public void AddAttachment(MessageAttachment attachment)
    {
        _attachments.Add(attachment);
    }

    public void UpdateContent(string? content)
    {
        Content = content?.Trim();
    }
}
