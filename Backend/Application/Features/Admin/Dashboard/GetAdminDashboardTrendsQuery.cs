using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs.Admin;
using MediatR;

namespace Application.Features.Admin.Dashboard;

public record GetAdminDashboardTrendsQuery(string? TimeRange, string? Region) : IRequest<Result<DashboardTrendsResponseDto>>;

public class GetAdminDashboardTrendsQueryHandler : IRequestHandler<GetAdminDashboardTrendsQuery, Result<DashboardTrendsResponseDto>>
{
    private readonly IAdminDashboardRepository _dashboardRepository;

    public GetAdminDashboardTrendsQueryHandler(IAdminDashboardRepository dashboardRepository)
    {
        _dashboardRepository = dashboardRepository;
    }

    public async Task<Result<DashboardTrendsResponseDto>> Handle(GetAdminDashboardTrendsQuery request, CancellationToken ct)
    {
        var trends = await _dashboardRepository.GetDashboardTrendsAsync(request.TimeRange, request.Region, ct);
        return Result<DashboardTrendsResponseDto>.Success(trends);
    }
}
