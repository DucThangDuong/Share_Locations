using System.Net;
using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs.Admin;
using MediatR;

namespace Application.Features.Admin.Users;

public record GetAdminUserDetailQuery(long UserId) : IRequest<Result<AdminUserDetailDto>>;

public class GetAdminUserDetailQueryHandler : IRequestHandler<GetAdminUserDetailQuery, Result<AdminUserDetailDto>>
{
    private readonly IAdminUserRepository _userRepository;
    private readonly ICurrentUserService _currentUserService;

    public GetAdminUserDetailQueryHandler(
        IAdminUserRepository userRepository,
        ICurrentUserService currentUserService)
    {
        _userRepository = userRepository;
        _currentUserService = currentUserService;
    }

    public async Task<Result<AdminUserDetailDto>> Handle(GetAdminUserDetailQuery request, CancellationToken ct)
    {
        var user = await _userRepository.GetUserDetailByIdAsync(request.UserId, ct);
        if (user == null)
        {
            return Result<AdminUserDetailDto>.Failure("Không tìm thấy người dùng.", HttpStatusCode.NotFound);
        }

        if (!_currentUserService.IsSystemAdmin && _currentUserService.IsCategoryAdmin)
        {
            var isSelf = _currentUserService.UserId == request.UserId;
            var targetIsAdmin = user.Roles.Any(r =>
                r.Equals("CATEGORY_ADMIN", StringComparison.OrdinalIgnoreCase) ||
                r.Equals("SYSTEM_ADMIN", StringComparison.OrdinalIgnoreCase));

            if (!isSelf && targetIsAdmin)
            {
                return Result<AdminUserDetailDto>.Failure("Bạn không có quyền xem thông tin của quản trị viên này.", HttpStatusCode.Forbidden);
            }
        }

        return Result<AdminUserDetailDto>.Success(user);
    }
}
