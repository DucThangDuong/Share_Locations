using Domain.Enums;

namespace Domain.Entities;

public class Notification
{
    public long Id { get; private set; }
    public long UserId { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string Content { get; private set; } = string.Empty;
    public NotificationType Type { get; private set; } = NotificationType.System;
    public long? ReferenceId { get; private set; }
    public bool IsRead { get; private set; }
    public DateTime CreatedAt { get; private set; }

    // Navigation
    public virtual User User { get; private set; } = null!;
}
