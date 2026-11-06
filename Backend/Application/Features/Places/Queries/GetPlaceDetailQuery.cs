using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Places.Queries;

public record GetPlaceDetailQuery(long Id, long? UserId = null) : IRequest<Result<PlaceDetailDto>>;

public class GetPlaceDetailQueryHandler : IRequestHandler<GetPlaceDetailQuery, Result<PlaceDetailDto>>
{
    private readonly IPlaceRepository _placeRepository;
    private readonly IRecommendationService? _recommendationService;

    public GetPlaceDetailQueryHandler(IPlaceRepository placeRepository, IRecommendationService? recommendationService = null)
    {
        _placeRepository = placeRepository;
        _recommendationService = recommendationService;
    }

    public async Task<Result<PlaceDetailDto>> Handle(GetPlaceDetailQuery request, CancellationToken ct)
    {
        var place = await _placeRepository.GetPlaceDetailAsync(request.Id, request.UserId, ct);
        if (place == null)
        {
            return Result<PlaceDetailDto>.NotFound($"Không tìm thấy thông tin địa điểm với mã #{request.Id}");
        }

        if (request.UserId.HasValue && request.UserId.Value > 0 && _recommendationService != null)
        {
            await _recommendationService.InvalidateUserVectorCacheAsync(request.UserId.Value, ct);
        }

        return Result<PlaceDetailDto>.Success(place);
    }
}
