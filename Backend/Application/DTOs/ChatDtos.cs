using Domain.Enums;

namespace Application.DTOs;

public class InboxItemDto
{
    public long RoomId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public bool IsGroup { get; set; }
    public string? LastMessage { get; set; }
    public DateTime? LastMessageAt { get; set; }
    public int UnreadCount { get; set; }
    public long? OtherUserId { get; set; }
}

public class ChatMessageDto
{
    public long Id { get; set; }
    public long RoomId { get; set; }
    public long SenderId { get; set; }
    public string SenderName { get; set; } = string.Empty;
    public string? SenderAvatarUrl { get; set; }
    public string? Content { get; set; }
    public long? ReplyToMessageId { get; set; }
    public string? ReplyToMessageSnippet { get; set; }
    public string? ReplyToSenderName { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<MessageAttachmentDto> Attachments { get; set; } = new();
    public List<MessageReactionDto> Reactions { get; set; } = new();
}

public class MessageAttachmentDto
{
    public long Id { get; set; }
    public MessageAttachmentType AttachmentType { get; set; }
    public string? MediaUrl { get; set; }
    public string? FileName { get; set; }
    public long? FileSizeBytes { get; set; }
    public int? DurationSeconds { get; set; }
    public int DisplayOrder { get; set; }

    // Place attachment preview
    public long? PlaceId { get; set; }
    public string? PlaceName { get; set; }
    public string? PlaceCoverUrl { get; set; }

    // Food attachment preview
    public long? FoodId { get; set; }
    public string? FoodName { get; set; }
    public string? FoodCoverUrl { get; set; }

    // Trip attachment preview
    public long? TripId { get; set; }
    public string? TripTitle { get; set; }
    public string? TripCoverUrl { get; set; }
}

public class MessageReactionDto
{
    public long MessageId { get; set; }
    public long UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string Emoji { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class CreateAttachmentInput
{
    public MessageAttachmentType AttachmentType { get; set; }
    public string? MediaUrl { get; set; }
    public string? FileName { get; set; }
    public long? FileSizeBytes { get; set; }
    public int? DurationSeconds { get; set; }
    public long? PlaceId { get; set; }
    public long? FoodId { get; set; }
    public long? TripId { get; set; }
}


public class ChatRoomMemberDto
{
    public long UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string? Email { get; set; }
    public DateTime JoinedAt { get; set; }
    public bool IsAdmin { get; set; }
    public string Role { get; set; } = "Member";
}