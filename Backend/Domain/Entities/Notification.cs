using Domain.Enums;

namespace Domain.Entities;

public class Notification
{
    public long Id { get; private set; }
    public long UserId { get; private set; }
    public long? ActorUserId { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string Content { get; private set; } = string.Empty;
    public NotificationType Type { get; private set; } = NotificationType.System;
    public byte Priority { get; private set; } = 2;  // 1: Urgent, 2: Normal, 3: Low
    public string? GroupKey { get; private set; }
    public string? DeduplicationKey { get; private set; }
    public string? EntityType { get; private set; }
    public long? EntityId { get; private set; }
    public long? ReferenceId { get; private set; }
    public string? TargetUrl { get; private set; }
    public bool IsRead { get; private set; }
    public DateTime? ReadAt { get; private set; }
    public DateTime? ArchivedAt { get; private set; }
    public DateTime? ExpiresAt { get; private set; }
    public string? DataJSON { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    // Navigation
    public virtual User User { get; private set; } = null!;
    public virtual User? ActorUser { get; private set; }

    protected Notification() { }

    public Notification(
        long userId,
        string title,
        string content,
        NotificationType type = NotificationType.System,
        long? actorUserId = null,
        byte priority = 2,
        string? entityType = null,
        long? entityId = null,
        long? referenceId = null,
        string? targetUrl = null,
        string? groupKey = null,
        string? deduplicationKey = null,
        string? dataJson = null,
        DateTime? expiresAt = null)
    {
        UserId = userId;
        Title = title;
        Content = content;
        Type = type;
        ActorUserId = actorUserId;
        Priority = priority;
        EntityType = entityType;
        EntityId = entityId;
        ReferenceId = referenceId ?? entityId;
        TargetUrl = targetUrl;
        GroupKey = groupKey;
        DeduplicationKey = deduplicationKey;
        DataJSON = dataJson;
        ExpiresAt = expiresAt;
        IsRead = false;
        CreatedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void MarkAsRead()
    {
        IsRead = true;
        ReadAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Archive()
    {
        ArchivedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }
}
