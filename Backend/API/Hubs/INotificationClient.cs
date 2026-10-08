using Application.DTOs;

namespace API.Hubs;

public interface INotificationClient
{
    Task ReceiveNotification(NotificationDto notification);
    Task UnreadCountUpdated(int unreadCount);
}
