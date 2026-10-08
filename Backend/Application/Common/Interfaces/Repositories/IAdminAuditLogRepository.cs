using Application.Common;
using Application.DTOs.Admin;

namespace Application.Common.Interfaces.Repositories;

public interface IAdminAuditLogRepository
{
    Task<PagedResult<AdminAuditLogListItemDto>> GetAuditLogsAsync(
        GetAdminAuditLogsRequestDto filter,
        CancellationToken ct = default);

    Task<AdminAuditLogDetailDto?> GetAuditLogDetailAsync(
        long id,
        CancellationToken ct = default);
}
