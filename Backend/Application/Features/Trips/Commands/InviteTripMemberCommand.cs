using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Trips.Commands;

public record InviteTripMemberCommand(long TripId, long OwnerUserId, InviteTripMemberRequestDto Dto) : IRequest<Result>;

public class InviteTripMemberCommandHandler : IRequestHandler<InviteTripMemberCommand, Result>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly INotificationRepository _notificationRepository;
    private readonly INotificationNotifier _notifier;

    public InviteTripMemberCommandHandler(
        IUnitOfWork unitOfWork,
        INotificationRepository notificationRepository,
        INotificationNotifier notifier)
    {
        _unitOfWork = unitOfWork;
        _notificationRepository = notificationRepository;
        _notifier = notifier;
    }

    public async Task<Result> Handle(InviteTripMemberCommand request, CancellationToken ct)
    {
        var trip = await _unitOfWork.Trips.GetByIdAsync(request.TripId, ct);
        if (trip == null)
        {
            return Result.NotFound("Chuyến đi không tồn tại.");
        }

        // BOLA Check: CHỈ Owner mới được mời thành viên mới
        if (trip.UserId != request.OwnerUserId)
        {
            return Result.Forbidden("Chỉ chủ sở hữu mới có quyền mời thành viên vào chuyến đi.");
        }

        if (string.IsNullOrWhiteSpace(request.Dto.Email))
        {
            return Result.Failure("Email người nhận không được để trống.");
        }

        var targetUser = await _unitOfWork.Users.GetByEmailAsync(request.Dto.Email.Trim(), ct);
        if (targetUser == null)
        {
            return Result.NotFound("Không tìm thấy người dùng với địa chỉ email này.");
        }

        if (targetUser.Id == trip.UserId)
        {
            return Result.Failure("Người dùng này là chủ sở hữu của chuyến đi.");
        }

        var existingMember = await _unitOfWork.Trips.GetMemberAsync(trip.Id, targetUser.Id, ct);
        if (existingMember != null)
        {
            return Result.Conflict("Người dùng này đã tham gia chuyến đi.");
        }

        var role = request.Dto.Role.Equals("Editor", StringComparison.OrdinalIgnoreCase)
            ? TripMemberRole.Editor
            : TripMemberRole.Member;

        var member = new TripMember(trip.Id, targetUser.Id, role);
        await _unitOfWork.Trips.AddMemberAsync(member, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        // Gửi thông báo lời mời chuyến đi cho thành viên mới
        try
        {
            var ownerProfile = await _unitOfWork.UserProfiles.GetByUserIdAsync(request.OwnerUserId, ct);
            var ownerName = !string.IsNullOrWhiteSpace(ownerProfile?.FullName) ? ownerProfile.FullName : "Người tạo chuyến đi";
            var notif = await _notificationRepository.CreateNotificationAsync(new CreateNotificationInput
            {
                UserId = targetUser.Id,
                ActorUserId = request.OwnerUserId,
                Title = "Lời mời tham gia chuyến đi",
                Content = $"{ownerName} đã thêm bạn vào chuyến đi '{trip.Title}'.",
                Type = NotificationType.Trip,
                Priority = 2,
                EntityType = "TRIP",
                EntityId = trip.Id,
                TargetUrl = $"/trips/{trip.Id}",
                GroupKey = $"TRIP_{trip.Id}"
            }, ct);

            var unread = await _notificationRepository.GetUnreadCountAsync(targetUser.Id, ct);
            await _notifier.NotifyAsync(targetUser.Id, notif, unread, ct);
        }
        catch
        {
            // Non-blocking notification dispatch
        }

        return Result.Success("Đã thêm thành viên vào chuyến đi thành công.");
    }
}
