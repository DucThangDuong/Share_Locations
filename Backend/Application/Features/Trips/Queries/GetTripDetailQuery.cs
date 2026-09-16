using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Trips.Queries;

public record GetTripDetailQuery(long TripId, long? CurrentUserId) : IRequest<Result<TripDetailDto>>;

public class GetTripDetailQueryHandler : IRequestHandler<GetTripDetailQuery, Result<TripDetailDto>>
{
    private readonly ITripRepository _tripRepository;

    public GetTripDetailQueryHandler(ITripRepository tripRepository)
    {
        _tripRepository = tripRepository;
    }

    public async Task<Result<TripDetailDto>> Handle(GetTripDetailQuery request, CancellationToken ct)
    {
        var result = await _tripRepository.GetTripDetailAsync(request.TripId, request.CurrentUserId, ct);
        if (result == null)
        {
            return Result<TripDetailDto>.NotFound("Chuyến đi không tồn tại hoặc bạn không có quyền xem chuyến đi riêng tư này.");
        }

        return Result<TripDetailDto>.Success(result, "Lấy thông tin chuyến đi thành công.");
    }
}
