using Domain.Constants;
using Domain.Enums;

namespace Application.DTOs;

public class NotificationDto
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public long? ActorUserId { get; set; }
    public string? ActorName { get; set; }
    public string? ActorAvatarUrl { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public NotificationType Type { get; set; }
    public string TypeName => AdminDisplayNames.GetNotificationTypeName(Type);
    public byte Priority { get; set; } = 2; // 1: Urgent, 2: Normal, 3: Low
    public string? GroupKey { get; set; }
    public string? DeduplicationKey { get; set; }
    public string? EntityType { get; set; }
    public long? EntityId { get; set; }
    public long? ReferenceId { get; set; }
    public string? TargetUrl { get; set; }
    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }
    public string? DataJSON { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class NotificationPagedResultDto
{
    public IReadOnlyList<NotificationDto> Items { get; set; } = Array.Empty<NotificationDto>();
    public int TotalCount { get; set; }
    public int UnreadCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / Math.Max(1, PageSize));
    public bool HasNextPage => Page < TotalPages;
}

public class CreateNotificationInput
{
    public long UserId { get; set; }
    public long? ActorUserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public NotificationType Type { get; set; } = NotificationType.System;
    public byte Priority { get; set; } = 2;
    public string? GroupKey { get; set; }
    public string? DeduplicationKey { get; set; }
    public string? EntityType { get; set; }
    public long? EntityId { get; set; }
    public long? ReferenceId { get; set; }
    public string? TargetUrl { get; set; }
    public string? DataJSON { get; set; }
    public DateTime? ExpiresAt { get; set; }
}
