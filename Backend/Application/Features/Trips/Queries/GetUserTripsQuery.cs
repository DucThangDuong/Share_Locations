using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Trips.Queries;

public record GetUserTripsQuery(
    long TargetUserId,
    long? CurrentUserId = null,
    string? Status = "all",
    byte? Privacy = null,
    int Page = 1,
    int PageSize = 15) : IRequest<Result<PagedResult<UserTripSummaryDto>>>;

public class GetUserTripsQueryHandler : IRequestHandler<GetUserTripsQuery, Result<PagedResult<UserTripSummaryDto>>>
{
    private readonly ITripRepository _tripRepository;

    public GetUserTripsQueryHandler(ITripRepository tripRepository)
    {
        _tripRepository = tripRepository;
    }

    public async Task<Result<PagedResult<UserTripSummaryDto>>> Handle(GetUserTripsQuery request, CancellationToken ct)
    {
        bool isCurrentUser = request.CurrentUserId.HasValue && request.CurrentUserId.Value == request.TargetUserId;
        byte? effectivePrivacy = !isCurrentUser ? (byte)0 : request.Privacy;

        var result = await _tripRepository.GetUserTripsAsync(
            request.TargetUserId,
            request.Status,
            effectivePrivacy,
            request.Page > 0 ? request.Page : 1,
            request.PageSize > 0 ? request.PageSize : 15,
            ct);

        return Result<PagedResult<UserTripSummaryDto>>.Success(result, "Lấy danh sách chuyến đi thành công.");
    }
}
