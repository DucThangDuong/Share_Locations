using System.Net;
using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Domain.Enums;
using MediatR;

namespace Application.Features.Admin.Users;

public record UpdateAdminUserStatusCommand(
    long UserId,
    byte Status,
    string? Reason) : IRequest<Result<bool>>;

public class UpdateAdminUserStatusCommandHandler : IRequestHandler<UpdateAdminUserStatusCommand, Result<bool>>
{
    private readonly IAdminUserRepository _userRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly INotificationRepository _notificationRepository;
    private readonly INotificationNotifier _notifier;
    private readonly ITokenCacheService _tokenCacheService;

    public UpdateAdminUserStatusCommandHandler(
        IAdminUserRepository userRepository,
        ICurrentUserService currentUserService,
        INotificationRepository notificationRepository,
        INotificationNotifier notifier,
        ITokenCacheService tokenCacheService)
    {
        _userRepository = userRepository;
        _currentUserService = currentUserService;
        _notificationRepository = notificationRepository;
        _notifier = notifier;
        _tokenCacheService = tokenCacheService;
    }

    public async Task<Result<bool>> Handle(UpdateAdminUserStatusCommand request, CancellationToken ct)
    {
        var targetUser = await _userRepository.GetUserDetailByIdAsync(request.UserId, ct);
        if (targetUser == null)
        {
            return Result<bool>.Failure("Không tìm thấy người dùng.", HttpStatusCode.NotFound);
        }

        if (_currentUserService.UserId == request.UserId && request.Status != 1)
        {
            return Result<bool>.Failure("Bạn không thể tự khóa tài khoản của chính mình.", HttpStatusCode.BadRequest);
        }

        if (!_currentUserService.IsSystemAdmin && _currentUserService.IsCategoryAdmin)
        {
            var targetIsAdmin = targetUser.Roles.Any(r =>
                r.Equals("CATEGORY_ADMIN", StringComparison.OrdinalIgnoreCase) ||
                r.Equals("SYSTEM_ADMIN", StringComparison.OrdinalIgnoreCase));

            if (targetIsAdmin)
            {
                return Result<bool>.Failure("Admin cấp 1 không có quyền thay đổi trạng thái của quản trị viên khác.", HttpStatusCode.Forbidden);
            }
        }

        var success = await _userRepository.UpdateUserStatusAsync(
            request.UserId,
            request.Status,
            request.Reason,
            _currentUserService.UserId ?? 1,
            ct);

        if (success)
        {
            var isLocked = request.Status != (byte)UserStatus.Active;
            if (isLocked)
            {
                await _tokenCacheService.RemoveRefreshTokenAsync(request.UserId, ct);
                await _tokenCacheService.SetUserRevokedAfterMsAsync(
                    request.UserId,
                    DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                    TimeSpan.FromHours(25),
                    ct);
            }

            await _tokenCacheService.SetUserStatusAsync(
                request.UserId,
                request.Status.ToString(),
                TimeSpan.FromMinutes(1),
                ct);

            try
            {
                var title = isLocked ? "Cảnh báo: Tài khoản của bạn đã bị khóa" : "Tài khoản của bạn đã được mở khóa";
                var reasonText = !string.IsNullOrWhiteSpace(request.Reason) ? $". Lý do: {request.Reason}" : "";
                var content = isLocked
                    ? $"Tài khoản của bạn đã bị tạm dừng hoạt động do vi phạm tiêu chuẩn cộng đồng{reasonText}."
                    : "Tài khoản của bạn đã được kích hoạt lại. Chào mừng bạn quay trở lại!";

                var notif = await _notificationRepository.CreateNotificationAsync(new DTOs.CreateNotificationInput
                {
                    UserId = request.UserId,
                    ActorUserId = _currentUserService.UserId,
                    Title = title,
                    Content = content,
                    Type = Domain.Enums.NotificationType.Moderation,
                    Priority = isLocked ? (byte)1 : (byte)2,
                    TargetUrl = "/account/status",
                    GroupKey = $"USER_STATUS_{request.UserId}"
                }, ct);

                var unread = await _notificationRepository.GetUnreadCountAsync(request.UserId, ct);
                await _notifier.NotifyAsync(request.UserId, notif, unread, ct);
            }
            catch
            {
            }
        }

        return success
            ? Result<bool>.Success(true)
            : Result<bool>.Failure("Cập nhật trạng thái người dùng không thành công.", HttpStatusCode.BadRequest);
    }
}
