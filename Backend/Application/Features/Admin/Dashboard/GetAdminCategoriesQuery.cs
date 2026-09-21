using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs.Admin;
using MediatR;

namespace Application.Features.Admin.Dashboard;

public record GetAdminCategoriesQuery : IRequest<Result<IReadOnlyList<AdminCategoryDto>>>;

public class GetAdminCategoriesQueryHandler : IRequestHandler<GetAdminCategoriesQuery, Result<IReadOnlyList<AdminCategoryDto>>>
{
    private readonly IAdminDashboardRepository _dashboardRepository;

    public GetAdminCategoriesQueryHandler(IAdminDashboardRepository dashboardRepository)
    {
        _dashboardRepository = dashboardRepository;
    }

    public async Task<Result<IReadOnlyList<AdminCategoryDto>>> Handle(GetAdminCategoriesQuery request, CancellationToken ct)
    {
        var list = await _dashboardRepository.GetCategoriesAsync(ct);
        return Result<IReadOnlyList<AdminCategoryDto>>.Success(list);
    }
}
