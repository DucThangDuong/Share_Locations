using Application.DTOs.Admin;

namespace Application.Common.Interfaces.Repositories;

public interface IAdminDashboardRepository
{
    Task<AdminDashboardMetricsDto> GetDashboardMetricsAsync(CancellationToken ct = default);
    Task<IReadOnlyList<AdminProvinceCompletenessDto>> GetProvincesCompletenessAsync(CancellationToken ct = default);
    Task<IReadOnlyList<AdminCategoryDto>> GetCategoriesAsync(CancellationToken ct = default);
    Task<DashboardTrendsResponseDto> GetDashboardTrendsAsync(string? timeRange, string? region, CancellationToken ct = default);
    Task<SlaPerformanceResponseDto> GetSlaPerformanceAsync(CancellationToken ct = default);
    Task<IReadOnlyList<PriorityQueueItemDto>> GetPriorityQueueAsync(string? filter, int limit = 5, CancellationToken ct = default);
    Task<ContributorsSummaryDto> GetContributorsSummaryAsync(CancellationToken ct = default);
}
