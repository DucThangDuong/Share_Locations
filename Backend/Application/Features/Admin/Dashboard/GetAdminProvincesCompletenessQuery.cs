using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs.Admin;
using MediatR;

namespace Application.Features.Admin.Dashboard;

public record GetAdminProvincesCompletenessQuery : IRequest<Result<IReadOnlyList<AdminProvinceCompletenessDto>>>;

public class GetAdminProvincesCompletenessQueryHandler : IRequestHandler<GetAdminProvincesCompletenessQuery, Result<IReadOnlyList<AdminProvinceCompletenessDto>>>
{
    private readonly IAdminDashboardRepository _dashboardRepository;

    public GetAdminProvincesCompletenessQueryHandler(IAdminDashboardRepository dashboardRepository)
    {
        _dashboardRepository = dashboardRepository;
    }

    public async Task<Result<IReadOnlyList<AdminProvinceCompletenessDto>>> Handle(GetAdminProvincesCompletenessQuery request, CancellationToken ct)
    {
        var list = await _dashboardRepository.GetProvincesCompletenessAsync(ct);
        return Result<IReadOnlyList<AdminProvinceCompletenessDto>>.Success(list);
    }
}
