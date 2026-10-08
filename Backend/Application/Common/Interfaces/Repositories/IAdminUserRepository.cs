using Application.Common;
using Application.DTOs.Admin;

namespace Application.Common.Interfaces.Repositories;

public interface IAdminUserRepository
{
    Task<PagedResult<AdminUserListItemDto>> GetAdminUsersAsync(
        string? role,
        int? categoryId,
        int? regionId,
        int? provinceId,
        long? placeId,
        int? status,
        string? keyword,
        int page,
        int pageSize,
        CancellationToken ct = default);

    Task<AdminUserDetailDto?> GetUserDetailByIdAsync(
        long targetUserId,
        CancellationToken ct = default);

    Task<UpdateAdminScopesResponseDto> UpdateUserScopesAsync(
        long targetUserId,
        List<int> categoryIds,
        List<int> provinceIds,
        List<int>? regionIds,
        long updatedBy,
        CancellationToken ct = default);

    Task<bool> UpdateUserStatusAsync(
        long targetUserId,
        byte status,
        string? reason,
        long updatedBy,
        CancellationToken ct = default);

    Task<UserActivitiesDto> GetUserActivitiesAsync(
        long targetUserId,
        CancellationToken ct = default);

    Task<AdminAccessHistoryResultDto> GetAdminAccessHistoryAsync(
        long targetAdminId,
        int page,
        int pageSize,
        CancellationToken ct = default);

    Task<UpdateAdminUserRoleResponseDto> UpdateUserRoleAsync(
        long targetUserId,
        byte targetRoleId,
        List<int>? categoryIds,
        List<int>? provinceIds,
        List<int>? regionIds,
        string? reason,
        long updatedBy,
        CancellationToken ct = default);
}
