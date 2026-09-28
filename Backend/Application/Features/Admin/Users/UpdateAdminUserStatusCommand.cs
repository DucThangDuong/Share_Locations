using System.Net;
using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
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

    public UpdateAdminUserStatusCommandHandler(
        IAdminUserRepository userRepository,
        ICurrentUserService currentUserService)
    {
        _userRepository = userRepository;
        _currentUserService = currentUserService;
    }

    public async Task<Result<bool>> Handle(UpdateAdminUserStatusCommand request, CancellationToken ct)
    {
        var targetUser = await _userRepository.GetUserDetailByIdAsync(request.UserId, ct);
        if (targetUser == null)
        {
            return Result<bool>.Failure("Không tìm thấy người dùng.", HttpStatusCode.NotFound);
        }

        // Không được phép tự khóa chính mình
        if (_currentUserService.UserId == request.UserId && request.Status != 1)
        {
            return Result<bool>.Failure("Bạn không thể tự khóa tài khoản của chính mình.", HttpStatusCode.BadRequest);
        }

        // Category Admin chỉ được khóa/mở khóa USER thường, không được can thiệp Admin khác
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

        return success 
            ? Result<bool>.Success(true)
            : Result<bool>.Failure("Cập nhật trạng thái người dùng không thành công.", HttpStatusCode.BadRequest);
    }
}
