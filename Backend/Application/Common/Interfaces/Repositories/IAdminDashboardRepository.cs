using Application.DTOs.Admin;

namespace Application.Common.Interfaces.Repositories;

public interface IAdminDashboardRepository
{
    Task<AdminDashboardMetricsDto> GetDashboardMetricsAsync(CancellationToken ct = default);
    Task<IReadOnlyList<AdminProvinceCompletenessDto>> GetProvincesCompletenessAsync(CancellationToken ct = default);
    Task<IReadOnlyList<AdminCategoryDto>> GetCategoriesAsync(CancellationToken ct = default);
}
