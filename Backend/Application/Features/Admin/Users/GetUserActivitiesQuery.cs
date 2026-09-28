using System.Net;
using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs.Admin;
using MediatR;

namespace Application.Features.Admin.Users;

public record GetUserActivitiesQuery(long UserId) : IRequest<Result<UserActivitiesDto>>;

public class GetUserActivitiesQueryHandler : IRequestHandler<GetUserActivitiesQuery, Result<UserActivitiesDto>>
{
    private readonly IAdminUserRepository _userRepository;
    private readonly ICurrentUserService _currentUserService;

    public GetUserActivitiesQueryHandler(
        IAdminUserRepository userRepository,
        ICurrentUserService currentUserService)
    {
        _userRepository = userRepository;
        _currentUserService = currentUserService;
    }

    public async Task<Result<UserActivitiesDto>> Handle(GetUserActivitiesQuery request, CancellationToken ct)
    {
        var targetUser = await _userRepository.GetUserDetailByIdAsync(request.UserId, ct);
        if (targetUser == null)
        {
            return Result<UserActivitiesDto>.Failure("Không tìm thấy người dùng.", HttpStatusCode.NotFound);
        }

        if (!_currentUserService.IsSystemAdmin && _currentUserService.IsCategoryAdmin)
        {
            var isSelf = _currentUserService.UserId == request.UserId;
            var targetIsAdmin = targetUser.Roles.Any(r => 
                r.Equals("CATEGORY_ADMIN", StringComparison.OrdinalIgnoreCase) || 
                r.Equals("SYSTEM_ADMIN", StringComparison.OrdinalIgnoreCase));

            if (!isSelf && targetIsAdmin)
            {
                return Result<UserActivitiesDto>.Failure("Bạn không có quyền xem hoạt động của quản trị viên khác.", HttpStatusCode.Forbidden);
            }
        }

        var result = await _userRepository.GetUserActivitiesAsync(request.UserId, ct);
        return Result<UserActivitiesDto>.Success(result);
    }
}
