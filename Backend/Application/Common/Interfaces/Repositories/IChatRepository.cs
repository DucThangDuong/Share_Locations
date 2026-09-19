using Application.DTOs;
using Domain.Entities;

namespace Application.Common.Interfaces.Repositories;

public interface IChatRepository
{
    Task<IReadOnlyList<InboxItemDto>> GetInboxAsync(long currentUserId, CancellationToken ct = default);
    Task<long> GetOrCreateDirectRoomAsync(long userAId, long userBId, CancellationToken ct = default);
    Task<long> CreateGroupRoomAsync(string name, long creatorId, IReadOnlyList<long> memberIds, CancellationToken ct = default);
    Task<bool> AddMembersToRoomAsync(long roomId, IReadOnlyList<long> userIds, CancellationToken ct = default);
    Task<bool> UpdateRoomNameAsync(long roomId, string name, CancellationToken ct = default);
    Task<bool> RemoveMemberFromRoomAsync(long roomId, long userId, CancellationToken ct = default);
    Task<bool> DisbandGroupRoomAsync(long roomId, CancellationToken ct = default);
    Task<ChatRoom?> GetRoomByIdAsync(long roomId, CancellationToken ct = default);
    Task<IReadOnlyList<long>> GetRoomMemberUserIdsAsync(long roomId, CancellationToken ct = default);
    Task<IReadOnlyList<ChatRoomMemberDto>> GetRoomMembersAsync(long roomId, CancellationToken ct = default);
    Task<IReadOnlyList<long>> GetRoomIdsForUserAsync(long userId, CancellationToken ct = default);
    Task<bool> IsUserInRoomAsync(long roomId, long userId, CancellationToken ct = default);
    Task<IReadOnlyList<ChatMessageDto>> GetRoomMessagesAsync(long roomId, long currentUserId, int page = 1, int limit = 20, CancellationToken ct = default);
    Task<ChatMessageDto?> GetMessageByIdAsync(long messageId, CancellationToken ct = default);
    Task<ChatMessageDto> SendMessageAsync(
        long roomId,
        long senderId,
        string? content,
        long? replyToMessageId = null,
        IReadOnlyList<CreateAttachmentInput>? attachments = null,
        CancellationToken ct = default);
    Task<bool> MarkRoomAsReadAsync(long roomId, long userId, CancellationToken ct = default);
    Task<bool> AddReactionAsync(long messageId, long userId, string emoji, CancellationToken ct = default);
}
