using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs.Admin;
using MediatR;

namespace Application.Features.Admin.Dashboard;

public record GetAdminPriorityQueueQuery(string? Filter, int Limit = 5) : IRequest<Result<IReadOnlyList<PriorityQueueItemDto>>>;

public class GetAdminPriorityQueueQueryHandler : IRequestHandler<GetAdminPriorityQueueQuery, Result<IReadOnlyList<PriorityQueueItemDto>>>
{
    private readonly IAdminDashboardRepository _dashboardRepository;

    public GetAdminPriorityQueueQueryHandler(IAdminDashboardRepository dashboardRepository)
    {
        _dashboardRepository = dashboardRepository;
    }

    public async Task<Result<IReadOnlyList<PriorityQueueItemDto>>> Handle(GetAdminPriorityQueueQuery request, CancellationToken ct)
    {
        var items = await _dashboardRepository.GetPriorityQueueAsync(request.Filter, request.Limit, ct);
        return Result<IReadOnlyList<PriorityQueueItemDto>>.Success(items);
    }
}
