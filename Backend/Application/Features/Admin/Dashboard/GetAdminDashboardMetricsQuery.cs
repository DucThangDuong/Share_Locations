using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs.Admin;
using MediatR;

namespace Application.Features.Admin.Dashboard;

public record GetAdminDashboardMetricsQuery : IRequest<Result<AdminDashboardMetricsDto>>;

public class GetAdminDashboardMetricsQueryHandler : IRequestHandler<GetAdminDashboardMetricsQuery, Result<AdminDashboardMetricsDto>>
{
    private readonly IAdminDashboardRepository _dashboardRepository;

    public GetAdminDashboardMetricsQueryHandler(IAdminDashboardRepository dashboardRepository)
    {
        _dashboardRepository = dashboardRepository;
    }

    public async Task<Result<AdminDashboardMetricsDto>> Handle(GetAdminDashboardMetricsQuery request, CancellationToken ct)
    {
        var metrics = await _dashboardRepository.GetDashboardMetricsAsync(ct);
        return Result<AdminDashboardMetricsDto>.Success(metrics);
    }
}
