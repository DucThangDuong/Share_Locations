using Application.Common;
using Application.DTOs.Admin;

namespace Application.Common.Interfaces.Repositories;

public interface IAdminProposalRepository
{
    Task<PagedResult<AdminProposalDto>> GetProposalsAsync(int? status, string? keyword, int page, int pageSize, CancellationToken ct = default);
    Task<AdminProposalDto?> GetProposalDetailAsync(long id, CancellationToken ct = default);
    Task<bool> ApproveProposalAsync(long id, long adminId, long? targetPlaceId, CancellationToken ct = default);
    Task<bool> RejectProposalAsync(long id, long adminId, string reason, CancellationToken ct = default);
}
