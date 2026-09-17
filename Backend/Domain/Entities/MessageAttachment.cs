using Domain.Enums;

namespace Domain.Entities;

public class MessageAttachment
{
    public long Id { get; private set; }
    public long MessageId { get; private set; }
    public MessageAttachmentType AttachmentType { get; private set; }

    public long? PlaceId { get; private set; }
    public long? FoodId { get; private set; }
    public long? TripId { get; private set; }

    public string? MediaUrl { get; private set; }
    public string? FileName { get; private set; }
    public long? FileSizeBytes { get; private set; }
    public int? DurationSeconds { get; private set; }
    public int DisplayOrder { get; private set; }
    public DateTime CreatedAt { get; private set; }

    // Navigation
    public virtual Message Message { get; private set; } = null!;
    public virtual Place? Place { get; private set; }
    public virtual Food? Food { get; private set; }
    public virtual Trip? Trip { get; private set; }

    protected MessageAttachment() { }

    public MessageAttachment(
        long messageId,
        MessageAttachmentType attachmentType,
        long? placeId = null,
        long? foodId = null,
        long? tripId = null,
        string? mediaUrl = null,
        string? fileName = null,
        long? fileSizeBytes = null,
        int? durationSeconds = null,
        int displayOrder = 0)
    {
        MessageId = messageId;
        AttachmentType = attachmentType;
        PlaceId = placeId;
        FoodId = foodId;
        TripId = tripId;
        MediaUrl = mediaUrl?.Trim();
        FileName = fileName?.Trim();
        FileSizeBytes = fileSizeBytes;
        DurationSeconds = durationSeconds;
        DisplayOrder = displayOrder;
        CreatedAt = DateTime.UtcNow;
    }
}
