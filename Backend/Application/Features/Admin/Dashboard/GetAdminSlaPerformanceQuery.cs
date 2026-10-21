using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs.Admin;
using MediatR;

namespace Application.Features.Admin.Dashboard;

public record GetAdminSlaPerformanceQuery : IRequest<Result<SlaPerformanceResponseDto>>;

public class GetAdminSlaPerformanceQueryHandler : IRequestHandler<GetAdminSlaPerformanceQuery, Result<SlaPerformanceResponseDto>>
{
    private readonly IAdminDashboardRepository _dashboardRepository;

    public GetAdminSlaPerformanceQueryHandler(IAdminDashboardRepository dashboardRepository)
    {
        _dashboardRepository = dashboardRepository;
    }

    public async Task<Result<SlaPerformanceResponseDto>> Handle(GetAdminSlaPerformanceQuery request, CancellationToken ct)
    {
        var sla = await _dashboardRepository.GetSlaPerformanceAsync(ct);
        return Result<SlaPerformanceResponseDto>.Success(sla);
    }
}
