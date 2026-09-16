using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Trips.Queries;

public record GetUserTripsQuery(long UserId, string? Status, int Page = 1, int PageSize = 20) : IRequest<Result<PagedResult<UserTripSummaryDto>>>;

public class GetUserTripsQueryHandler : IRequestHandler<GetUserTripsQuery, Result<PagedResult<UserTripSummaryDto>>>
{
    private readonly ITripRepository _tripRepository;

    public GetUserTripsQueryHandler(ITripRepository tripRepository)
    {
        _tripRepository = tripRepository;
    }

    public async Task<Result<PagedResult<UserTripSummaryDto>>> Handle(GetUserTripsQuery request, CancellationToken ct)
    {
        var result = await _tripRepository.GetUserTripsAsync(
            request.UserId,
            request.Status,
            request.Page,
            request.PageSize,
            ct);

        return Result<PagedResult<UserTripSummaryDto>>.Success(result, "Lấy danh sách chuyến đi thành công.");
    }
}
