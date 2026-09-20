using Application.DTOs;

namespace Application.Common.Interfaces;

public interface IChatNotifier
{
    Task NotifyMessageReceivedAsync(long roomId, ChatMessageDto message, CancellationToken ct = default);
    Task NotifyMessageReadAsync(long roomId, long userId, DateTime readAt, CancellationToken ct = default);
    Task NotifyMessageReactedAsync(long roomId, long messageId, long userId, string emoji, CancellationToken ct = default);
    Task NotifyMessageEditedAsync(long roomId, long messageId, string newContent, CancellationToken ct = default);
    Task NotifyMessageDeletedAsync(long roomId, long messageId, CancellationToken ct = default);
}
