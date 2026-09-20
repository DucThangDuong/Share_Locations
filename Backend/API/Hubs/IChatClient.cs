using Application.DTOs;

namespace API.Hubs;

public interface IChatClient
{
    Task ReceiveMessage(ChatMessageDto message);
    Task MessageRead(long roomId, long userId, DateTime readAt);
    Task MessageReacted(long roomId, long messageId, long userId, string emoji);
    Task UserTyping(long roomId, long userId, bool isTyping);
    Task MessageEdited(long roomId, long messageId, string newContent);
    Task MessageDeleted(long roomId, long messageId);
}
