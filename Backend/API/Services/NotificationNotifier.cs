using API.Hubs;
using Application.Common.Interfaces;
using Application.DTOs;
using Microsoft.AspNetCore.SignalR;

namespace API.Services;

public class NotificationNotifier : INotificationNotifier
{
    private readonly IHubContext<NotificationHub, INotificationClient> _hubContext;
    private readonly ILogger<NotificationNotifier> _logger;

    public NotificationNotifier(
        IHubContext<NotificationHub, INotificationClient> hubContext,
        ILogger<NotificationNotifier> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task NotifyAsync(long userId, NotificationDto notification, int newUnreadCount, CancellationToken ct = default)
    {
        try
        {
            var groupName = NotificationHub.GetUserGroupName(userId);
            _logger.LogInformation("Pushing notification {NotificationId} to user {UserId} via SignalR", notification.Id, userId);

            // Gửi qua User ID claim và Group tương ứng để bảo đảm cả 2 cơ chế đều nhận được
            await _hubContext.Clients.User(userId.ToString()).ReceiveNotification(notification);
            await _hubContext.Clients.Group(groupName).ReceiveNotification(notification);

            // Cập nhật số lượng chưa đọc realtime
            await NotifyUnreadCountAsync(userId, newUnreadCount, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error pushing realtime notification to user {UserId}", userId);
        }
    }

    public async Task NotifyUnreadCountAsync(long userId, int newUnreadCount, CancellationToken ct = default)
    {
        try
        {
            var groupName = NotificationHub.GetUserGroupName(userId);
            await _hubContext.Clients.User(userId.ToString()).UnreadCountUpdated(newUnreadCount);
            await _hubContext.Clients.Group(groupName).UnreadCountUpdated(newUnreadCount);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error pushing unread count to user {UserId}", userId);
        }
    }
}
