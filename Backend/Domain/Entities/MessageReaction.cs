namespace Domain.Entities;

public class MessageReaction
{
    public long MessageId { get; private set; }
    public long UserId { get; private set; }
    public string Emoji { get; private set; } = string.Empty;
    public DateTime CreatedAt { get; private set; }

    // Navigation
    public virtual Message Message { get; private set; } = null!;
    public virtual User User { get; private set; } = null!;

    protected MessageReaction() { }

    public MessageReaction(long messageId, long userId, string emoji)
    {
        if (string.IsNullOrWhiteSpace(emoji))
            throw new ArgumentException("Emoji không được để trống.", nameof(emoji));

        MessageId = messageId;
        UserId = userId;
        Emoji = emoji.Trim();
        CreatedAt = DateTime.UtcNow;
    }
}
