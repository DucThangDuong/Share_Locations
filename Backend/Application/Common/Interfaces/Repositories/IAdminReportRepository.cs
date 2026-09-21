using Application.Common;
using Application.DTOs.Admin;
using Domain.Enums;

namespace Application.Common.Interfaces.Repositories;

public interface IAdminReportRepository
{
    Task<IReadOnlyList<ReportReasonDto>> GetReportReasonsAsync(string? targetType = null, CancellationToken ct = default);
    Task<long> CreateReportAsync(string targetType, long targetId, int reportTypeId, string? reason, long? reporterId, CancellationToken ct = default);
    Task<IReadOnlyList<ReportQueueItemDto>> GetMyReportsAsync(long userId, CancellationToken ct = default);
    Task<PagedResult<ReportQueueItemDto>> GetReportsQueueAsync(string? subTab, string? targetType, int? status, string? keyword, int page, int pageSize, CancellationToken ct = default);
    Task<IReadOnlyList<GroupedReportDto>> GetGroupedReportsAsync(CancellationToken ct = default);
    Task<bool> ResolveReportAsync(string targetType, long reportId, long adminId, ReportStatus status, string? actionTaken, string? resolutionNote, CancellationToken ct = default);
    Task<bool> ResolveGroupAsync(string targetType, long targetId, long adminId, ReportStatus status, string? actionTaken, string? resolutionNote, CancellationToken ct = default);
}
