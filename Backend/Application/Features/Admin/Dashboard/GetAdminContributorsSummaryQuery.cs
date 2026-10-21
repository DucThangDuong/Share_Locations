using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs.Admin;
using MediatR;

namespace Application.Features.Admin.Dashboard;

public record GetAdminContributorsSummaryQuery : IRequest<Result<ContributorsSummaryDto>>;

public class GetAdminContributorsSummaryQueryHandler : IRequestHandler<GetAdminContributorsSummaryQuery, Result<ContributorsSummaryDto>>
{
    private readonly IAdminDashboardRepository _dashboardRepository;

    public GetAdminContributorsSummaryQueryHandler(IAdminDashboardRepository dashboardRepository)
    {
        _dashboardRepository = dashboardRepository;
    }

    public async Task<Result<ContributorsSummaryDto>> Handle(GetAdminContributorsSummaryQuery request, CancellationToken ct)
    {
        var summary = await _dashboardRepository.GetContributorsSummaryAsync(ct);
        return Result<ContributorsSummaryDto>.Success(summary);
    }
}
