using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using Domain.Enums;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Chat.Commands;

public record CreateGroupRoomCommand(long CreatorId, string Name, IReadOnlyList<long> MemberIds) : IRequest<Result<long>>;

public class CreateGroupRoomCommandHandler : IRequestHandler<CreateGroupRoomCommand, Result<long>>
{
    private readonly IChatRepository _chatRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly INotificationRepository _notificationRepository;
    private readonly INotificationNotifier _notifier;

    public CreateGroupRoomCommandHandler(
        IChatRepository chatRepository,
        IUnitOfWork unitOfWork,
        INotificationRepository notificationRepository,
        INotificationNotifier notifier)
    {
        _chatRepository = chatRepository;
        _unitOfWork = unitOfWork;
        _notificationRepository = notificationRepository;
        _notifier = notifier;
    }

    public async Task<Result<long>> Handle(CreateGroupRoomCommand request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return Result<long>.Failure("Tên nhóm không được để trống.");
        }

        var cleanName = request.Name.Trim();
        if (cleanName.Length > 100)
        {
            return Result<long>.Failure("Tên nhóm không được vượt quá 100 ký tự.");
        }

        var validMemberIds = request.MemberIds?
            .Where(id => id > 0 && id != request.CreatorId)
            .Distinct()
            .ToList() ?? new List<long>();

        if (validMemberIds.Count == 0)
        {
            return Result<long>.Failure("Nhóm cần có ít nhất 1 thành viên khác.");
        }

        var roomId = await _chatRepository.CreateGroupRoomAsync(cleanName, request.CreatorId, validMemberIds, ct);

        // Gửi thông báo đến từng thành viên được thêm vào nhóm chat mới
        try
        {
            var creatorProfile = await _unitOfWork.UserProfiles.GetByUserIdAsync(request.CreatorId, ct);
            var creatorName = !string.IsNullOrWhiteSpace(creatorProfile?.FullName) ? creatorProfile.FullName : "Một người dùng";

            foreach (var memberId in validMemberIds)
            {
                var notif = await _notificationRepository.CreateNotificationAsync(new CreateNotificationInput
                {
                    UserId = memberId,
                    ActorUserId = request.CreatorId,
                    Title = "Được thêm vào nhóm trò chuyện",
                    Content = $"{creatorName} đã thêm bạn vào nhóm trò chuyện '{cleanName}'.",
                    Type = NotificationType.Social,
                    Priority = 2,
                    EntityType = "CHAT_ROOM",
                    EntityId = roomId,
                    TargetUrl = $"/chat?room={roomId}",
                    GroupKey = $"CHAT_ROOM_{roomId}"
                }, ct);

                var unread = await _notificationRepository.GetUnreadCountAsync(memberId, ct);
                await _notifier.NotifyAsync(memberId, notif, unread, ct);
            }
        }
        catch
        {
            // Non-blocking notification dispatch
        }

        return Result<long>.Success(roomId, "Tạo nhóm trò chuyện thành công.");
    }
}