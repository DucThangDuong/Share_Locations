using System.Net;
using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs.Admin;
using Domain.Constants;
using MediatR;

namespace Application.Features.Admin.Users;

public record UpdateAdminUserRoleCommand(
    long UserId,
    string Role,
    List<int>? CategoryIds,
    List<int>? ProvinceIds,
    List<int>? RegionIds,
    string? Reason) : IRequest<Result<UpdateAdminUserRoleResponseDto>>;

public class UpdateAdminUserRoleCommandHandler : IRequestHandler<UpdateAdminUserRoleCommand, Result<UpdateAdminUserRoleResponseDto>>
{
    private readonly IAdminUserRepository _userRepository;
    private readonly ICurrentUserService _currentUserService;

    public UpdateAdminUserRoleCommandHandler(
        IAdminUserRepository userRepository,
        ICurrentUserService currentUserService)
    {
        _userRepository = userRepository;
        _currentUserService = currentUserService;
    }

    public async Task<Result<UpdateAdminUserRoleResponseDto>> Handle(UpdateAdminUserRoleCommand request, CancellationToken ct)
    {
        if (!_currentUserService.IsSystemAdmin)
        {
            return Result<UpdateAdminUserRoleResponseDto>.Failure(
                "Chỉ Quản trị viên hệ thống (SystemAdmin) mới có quyền gán hoặc thay đổi vai trò người dùng.",
                HttpStatusCode.Forbidden);
        }

        var normalizedRole = request.Role?.Trim().ToUpperInvariant() ?? string.Empty;
        byte targetRoleId;

        switch (normalizedRole)
        {
            case "USER":
            case "NORMAL":
            case "1":
                targetRoleId = AppRoles.UserRoleId;
                break;

            case "CATEGORY_ADMIN":
            case "CATEGORYADMIN":
            case "ADMIN1":
            case "STAFF":
            case "2":
                targetRoleId = AppRoles.CategoryAdminRoleId;
                break;

            case "SYSTEM_ADMIN":
            case "SYSTEMADMIN":
            case "SUPERADMIN":
            case "ADMIN":
            case "3":
                targetRoleId = AppRoles.SystemAdminRoleId;
                break;

            default:
                return Result<UpdateAdminUserRoleResponseDto>.Failure(
                    "Vai trò không hợp lệ. Chỉ chấp nhận các vai trò: USER, CATEGORY_ADMIN, SYSTEM_ADMIN.",
                    HttpStatusCode.BadRequest);
        }

        var targetUser = await _userRepository.GetUserDetailByIdAsync(request.UserId, ct);
        if (targetUser == null)
        {
            return Result<UpdateAdminUserRoleResponseDto>.Failure("Không tìm thấy người dùng.", HttpStatusCode.NotFound);
        }

        var currentAdminId = _currentUserService.UserId ?? 1;

        if (currentAdminId == request.UserId && targetRoleId != AppRoles.SystemAdminRoleId)
        {
            return Result<UpdateAdminUserRoleResponseDto>.Failure(
                "Bạn không thể tự hạ quyền Quản trị viên hệ thống của chính mình.",
                HttpStatusCode.BadRequest);
        }

        try
        {
            var result = await _userRepository.UpdateUserRoleAsync(
                request.UserId,
                targetRoleId,
                request.CategoryIds,
                request.ProvinceIds,
                request.RegionIds,
                request.Reason,
                currentAdminId,
                ct);

            return Result<UpdateAdminUserRoleResponseDto>.Success(result);
        }
        catch (InvalidOperationException ex)
        {
            return Result<UpdateAdminUserRoleResponseDto>.Failure(ex.Message, HttpStatusCode.BadRequest);
        }
    }
}
