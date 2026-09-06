using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Places.Queries;

public record GetPlaceDetailQuery(long Id) : IRequest<Result<PlaceDetailDto>>;

public class GetPlaceDetailQueryHandler : IRequestHandler<GetPlaceDetailQuery, Result<PlaceDetailDto>>
{
    private readonly IPlaceRepository _placeRepository;

    public GetPlaceDetailQueryHandler(IPlaceRepository placeRepository)
    {
        _placeRepository = placeRepository;
    }

    public async Task<Result<PlaceDetailDto>> Handle(GetPlaceDetailQuery request, CancellationToken ct)
    {
        var place = await _placeRepository.GetPlaceDetailAsync(request.Id, ct);
        if (place == null)
        {
            return Result<PlaceDetailDto>.NotFound($"Không tìm thấy thông tin địa điểm với mã #{request.Id}");
        }

        return Result<PlaceDetailDto>.Success(place);
    }
}
