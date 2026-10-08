using Application.DTOs;

namespace Application.Common.Interfaces;

public interface INotificationNotifier
{
    Task NotifyAsync(long userId, NotificationDto notification, int newUnreadCount, CancellationToken ct = default);
    Task NotifyUnreadCountAsync(long userId, int newUnreadCount, CancellationToken ct = default);
}
