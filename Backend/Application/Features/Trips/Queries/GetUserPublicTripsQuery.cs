using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Trips.Queries;

public record GetUserPublicTripsQuery(long UserId) : IRequest<Result<IReadOnlyList<PublicTripSummaryDto>>>;

public class GetUserPublicTripsQueryHandler : IRequestHandler<GetUserPublicTripsQuery, Result<IReadOnlyList<PublicTripSummaryDto>>>
{
    private readonly ITripRepository _tripRepository;

    public GetUserPublicTripsQueryHandler(ITripRepository tripRepository)
    {
        _tripRepository = tripRepository;
    }

    public async Task<Result<IReadOnlyList<PublicTripSummaryDto>>> Handle(GetUserPublicTripsQuery request, CancellationToken ct)
    {
        var result = await _tripRepository.GetUserPublicTripsAsync(request.UserId, ct);
        return Result<IReadOnlyList<PublicTripSummaryDto>>.Success(result, "Lấy danh sách chuyến đi công khai thành công.");
    }
}
