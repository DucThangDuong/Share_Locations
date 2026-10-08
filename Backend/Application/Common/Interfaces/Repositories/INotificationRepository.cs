using Application.DTOs;

namespace Application.Common.Interfaces.Repositories;

public interface INotificationRepository
{
    Task<NotificationPagedResultDto> GetPagedNotificationsAsync(
        long userId,
        int page,
        int pageSize,
        bool? unreadOnly = null,
        CancellationToken ct = default);

    Task<int> GetUnreadCountAsync(long userId, CancellationToken ct = default);

    Task<bool> MarkAsReadAsync(long notificationId, long userId, CancellationToken ct = default);

    Task<int> MarkAllAsReadAsync(long userId, CancellationToken ct = default);

    Task<bool> DeleteOrArchiveAsync(long notificationId, long userId, CancellationToken ct = default);

    Task<NotificationDto> CreateNotificationAsync(CreateNotificationInput input, CancellationToken ct = default);
}
