using System.Net;
using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs.Admin;
using MediatR;

namespace Application.Features.Admin.Users;

public record UpdateAdminUserScopesCommand(
    long UserId,
    List<int> CategoryIds,
    List<int> ProvinceIds,
    List<int>? RegionIds,
    string? Note) : IRequest<Result<UpdateAdminScopesResponseDto>>;

public class UpdateAdminUserScopesCommandHandler : IRequestHandler<UpdateAdminUserScopesCommand, Result<UpdateAdminScopesResponseDto>>
{
    private readonly IAdminUserRepository _userRepository;
    private readonly ICurrentUserService _currentUserService;

    public UpdateAdminUserScopesCommandHandler(
        IAdminUserRepository userRepository,
        ICurrentUserService currentUserService)
    {
        _userRepository = userRepository;
        _currentUserService = currentUserService;
    }

    public async Task<Result<UpdateAdminScopesResponseDto>> Handle(UpdateAdminUserScopesCommand request, CancellationToken ct)
    {
        // Chỉ có SYSTEM_ADMIN mới có quyền gán hoặc cập nhật phạm vi quản trị!
        if (!_currentUserService.IsSystemAdmin)
        {
            return Result<UpdateAdminScopesResponseDto>.Failure("Chỉ Admin hệ thống (SystemAdmin) mới có quyền phân công phạm vi quản lý.", HttpStatusCode.Forbidden);
        }

        var currentAdminId = _currentUserService.UserId ?? 1;

        var result = await _userRepository.UpdateUserScopesAsync(
            request.UserId,
            request.CategoryIds,
            request.ProvinceIds,
            request.RegionIds,
            currentAdminId,
            ct);

        return Result<UpdateAdminScopesResponseDto>.Success(result);
    }
}
