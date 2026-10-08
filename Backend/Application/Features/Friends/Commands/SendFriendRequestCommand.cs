using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Friends.Commands;

public record SendFriendRequestCommand(long UserId, long TargetUserId) : IRequest<Result>;

public class SendFriendRequestCommandHandler : IRequestHandler<SendFriendRequestCommand, Result>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly INotificationRepository _notificationRepository;
    private readonly INotificationNotifier _notifier;

    public SendFriendRequestCommandHandler(
        IUnitOfWork unitOfWork,
        INotificationRepository notificationRepository,
        INotificationNotifier notifier)
    {
        _unitOfWork = unitOfWork;
        _notificationRepository = notificationRepository;
        _notifier = notifier;
    }

    public async Task<Result> Handle(SendFriendRequestCommand request, CancellationToken ct)
    {
        if (request.UserId == request.TargetUserId)
        {
            return Result.Failure("Không thể gửi lời mời kết bạn cho chính mình.");
        }

        var targetUser = await _unitOfWork.Users.GetByIdAsync(request.TargetUserId, ct);
        if (targetUser == null)
        {
            return Result.NotFound("Người dùng không tồn tại.");
        }

        var existing = await _unitOfWork.Friendships.GetFriendshipAsync(request.UserId, request.TargetUserId, ct);

        if (existing != null)
        {
            if (existing.Status == FriendshipStatus.Accepted)
            {
                return Result.Failure("Hai bạn đã là bạn bè.");
            }

            if (existing.Status == FriendshipStatus.Blocked)
            {
                return Result.Forbidden("Không thể gửi lời mời kết bạn tới người dùng này.");
            }

            if (existing.Status == FriendshipStatus.Pending)
            {
                if (existing.ActionUserId == request.UserId)
                {
                    return Result.Failure("Bạn đã gửi lời mời kết bạn trước đó rồi.");
                }

                // Đối phương đã gửi lời mời cho mình trước -> chấp nhận kết bạn ngay lập tức
                existing.Accept(request.UserId);
                await _unitOfWork.SaveChangesAsync(ct);

                // Gửi thông báo chấp nhận kết bạn cho đối phương
                try
                {
                    var senderProfile = await _unitOfWork.UserProfiles.GetByUserIdAsync(request.UserId, ct);
                    var senderName = !string.IsNullOrWhiteSpace(senderProfile?.FullName) ? senderProfile.FullName : "Một người dùng";
                    var notif = await _notificationRepository.CreateNotificationAsync(new CreateNotificationInput
                    {
                        UserId = request.TargetUserId,
                        ActorUserId = request.UserId,
                        Title = "Lời mời kết bạn được chấp nhận",
                        Content = $"{senderName} đã đồng ý lời mời kết bạn. Hai bạn đã trở thành bạn bè!",
                        Type = NotificationType.Social,
                        Priority = 2,
                        EntityType = "USER",
                        EntityId = request.UserId,
                        TargetUrl = $"/profile/{request.UserId}",
                        GroupKey = $"FRIEND_ACCEPT_{request.UserId}_{request.TargetUserId}",
                        DeduplicationKey = $"FRIEND_ACCEPT_{request.UserId}_{request.TargetUserId}"
                    }, ct);

                    var unread = await _notificationRepository.GetUnreadCountAsync(request.TargetUserId, ct);
                    await _notifier.NotifyAsync(request.TargetUserId, notif, unread, ct);
                }
                catch
                {
                    // Non-blocking notification dispatch
                }

                return Result.Success("Hai bạn đã trở thành bạn bè!");
            }
        }

        var friendship = new Friendship(request.UserId, request.TargetUserId, request.UserId, FriendshipStatus.Pending);
        await _unitOfWork.Friendships.AddAsync(friendship, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        // Gửi thông báo lời mời kết bạn mới cho đối phương (TargetUserId)
        try
        {
            var senderProfile = await _unitOfWork.UserProfiles.GetByUserIdAsync(request.UserId, ct);
            var senderName = !string.IsNullOrWhiteSpace(senderProfile?.FullName) ? senderProfile.FullName : "Một người dùng";
            var notif = await _notificationRepository.CreateNotificationAsync(new CreateNotificationInput
            {
                UserId = request.TargetUserId,
                ActorUserId = request.UserId,
                Title = "Lời mời kết bạn mới",
                Content = $"{senderName} đã gửi cho bạn một lời mời kết bạn.",
                Type = NotificationType.Social,
                Priority = 2,
                EntityType = "USER",
                EntityId = request.UserId,
                TargetUrl = $"/profile/{request.UserId}",
                GroupKey = $"FRIEND_REQ_{request.UserId}_{request.TargetUserId}",
                DeduplicationKey = $"FRIEND_REQ_{request.UserId}_{request.TargetUserId}"
            }, ct);

            var unread = await _notificationRepository.GetUnreadCountAsync(request.TargetUserId, ct);
            await _notifier.NotifyAsync(request.TargetUserId, notif, unread, ct);
        }
        catch
        {
            // Non-blocking notification dispatch
        }

        return Result.Success("Đã gửi lời mời kết bạn thành công.");
    }
}
