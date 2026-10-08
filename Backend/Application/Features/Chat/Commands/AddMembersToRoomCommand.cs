using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using Domain.Enums;
using MediatR;

namespace Application.Features.Chat.Commands;

public record AddMembersToRoomCommand(long RoomId, long RequesterId, IReadOnlyList<long> UserIds) : IRequest<Result<bool>>;

public class AddMembersToRoomCommandHandler : IRequestHandler<AddMembersToRoomCommand, Result<bool>>
{
    private readonly IChatRepository _chatRepository;
    private readonly INotificationRepository _notificationRepository;
    private readonly INotificationNotifier _notifier;

    public AddMembersToRoomCommandHandler(
        IChatRepository chatRepository,
        INotificationRepository notificationRepository,
        INotificationNotifier notifier)
    {
        _chatRepository = chatRepository;
        _notificationRepository = notificationRepository;
        _notifier = notifier;
    }

    public async Task<Result<bool>> Handle(AddMembersToRoomCommand request, CancellationToken ct)
    {
        var room = await _chatRepository.GetRoomByIdAsync(request.RoomId, ct);
        if (room == null)
        {
            return Result<bool>.NotFound("Phòng trò chuyện không tồn tại.");
        }

        if (!room.IsGroup)
        {
            return Result<bool>.Failure("Chỉ có thể thêm thành viên vào phòng chat nhóm.");
        }

        var isMember = await _chatRepository.IsUserInRoomAsync(request.RoomId, request.RequesterId, ct);
        if (!isMember)
        {
            return Result<bool>.Unauthorized("Bạn không phải thành viên của nhóm trò chuyện này.");
        }

        var validUserIds = request.UserIds?
            .Where(id => id > 0 && id != request.RequesterId)
            .Distinct()
            .ToList() ?? new List<long>();

        if (validUserIds.Count == 0)
        {
            return Result<bool>.Failure("Danh sách thành viên cần thêm không hợp lệ.");
        }

        await _chatRepository.AddMembersToRoomAsync(request.RoomId, validUserIds, ct);

        // Bắn thông báo cho từng thành viên mới được thêm vào phòng chat
        var roomName = !string.IsNullOrWhiteSpace(room.Name) ? room.Name : "Nhóm trò chuyện";
        foreach (var memberId in validUserIds)
        {
            try
            {
                var notif = await _notificationRepository.CreateNotificationAsync(new CreateNotificationInput
                {
                    UserId = memberId,
                    ActorUserId = request.RequesterId,
                    Title = "Được thêm vào nhóm trò chuyện",
                    Content = $"Bạn đã được thêm vào nhóm trò chuyện '{roomName}'.",
                    Type = NotificationType.Social,
                    Priority = 2,
                    EntityType = "CHAT_ROOM",
                    EntityId = request.RoomId,
                    TargetUrl = $"/chat?room={request.RoomId}",
                    GroupKey = $"CHAT_ROOM_{request.RoomId}"
                }, ct);

                var unread = await _notificationRepository.GetUnreadCountAsync(memberId, ct);
                await _notifier.NotifyAsync(memberId, notif, unread, ct);
            }
            catch
            {
                // Non-blocking notification dispatch
            }
        }

        return Result<bool>.Success(true, "Thêm thành viên vào nhóm thành công.");
    }
}