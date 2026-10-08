using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using Domain.Enums;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Friends.Commands;

public record RespondFriendRequestCommand(long UserId, long TargetUserId, string Action) : IRequest<Result>;

public class RespondFriendRequestCommandHandler : IRequestHandler<RespondFriendRequestCommand, Result>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly INotificationRepository _notificationRepository;
    private readonly INotificationNotifier _notifier;

    public RespondFriendRequestCommandHandler(
        IUnitOfWork unitOfWork,
        INotificationRepository notificationRepository,
        INotificationNotifier notifier)
    {
        _unitOfWork = unitOfWork;
        _notificationRepository = notificationRepository;
        _notifier = notifier;
    }

    public async Task<Result> Handle(RespondFriendRequestCommand request, CancellationToken ct)
    {
        var existing = await _unitOfWork.Friendships.GetFriendshipAsync(request.UserId, request.TargetUserId, ct);
        if (existing == null || existing.Status != FriendshipStatus.Pending)
        {
            return Result.NotFound("Không tìm thấy lời mời kết bạn đang chờ xử lý.");
        }

        // BOLA Check: Chỉ người nhận lời mời mới có quyền phản hồi
        if (existing.ActionUserId == request.UserId)
        {
            return Result.Forbidden("Bạn không thể tự phản hồi lời mời do chính mình gửi.");
        }

        var action = request.Action?.Trim().ToLowerInvariant();
        if (action == "accept")
        {
            existing.Accept(request.UserId);
            await _unitOfWork.SaveChangesAsync(ct);

            // Gửi thông báo chấp nhận kết bạn cho đối phương (TargetUserId là người gửi lời mời ban đầu)
            try
            {
                var acceptorProfile = await _unitOfWork.UserProfiles.GetByUserIdAsync(request.UserId, ct);
                var acceptorName = !string.IsNullOrWhiteSpace(acceptorProfile?.FullName) ? acceptorProfile.FullName : "Một người dùng";
                var notif = await _notificationRepository.CreateNotificationAsync(new CreateNotificationInput
                {
                    UserId = request.TargetUserId,
                    ActorUserId = request.UserId,
                    Title = "Lời mời kết bạn được chấp nhận",
                    Content = $"{acceptorName} đã đồng ý lời mời kết bạn của bạn.",
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

            return Result.Success("Đã chấp nhận lời mời kết bạn.");
        }
        else if (action == "reject")
        {
            _unitOfWork.Friendships.Remove(existing);
            await _unitOfWork.SaveChangesAsync(ct);
            return Result.Success("Đã từ chối lời mời kết bạn.");
        }

        return Result.Failure("Hành động không hợp lệ. Chỉ chấp nhận 'accept' hoặc 'reject'.");
    }
}
