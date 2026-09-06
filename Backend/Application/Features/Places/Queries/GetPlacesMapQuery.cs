using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Places.Queries;

public record GetPlacesMapQuery(
    string? Keyword = null,
    string? Region = null,
    int? ProvinceId = null,
    int? CategoryId = null,
    double? MinLng = null,
    double? MinLat = null,
    double? MaxLng = null,
    double? MaxLat = null) : IRequest<Result<IReadOnlyList<PlaceMapItemDto>>>;

public class GetPlacesMapQueryHandler : IRequestHandler<GetPlacesMapQuery, Result<IReadOnlyList<PlaceMapItemDto>>>
{
    private readonly IPlaceRepository _placeRepository;

    public GetPlacesMapQueryHandler(IPlaceRepository placeRepository)
    {
        _placeRepository = placeRepository;
    }

    public async Task<Result<IReadOnlyList<PlaceMapItemDto>>> Handle(GetPlacesMapQuery request, CancellationToken ct)
    {
        var places = await _placeRepository.GetPlacesMapAsync(
            request.Keyword,
            request.Region,
            request.ProvinceId,
            request.CategoryId,
            request.MinLng,
            request.MinLat,
            request.MaxLng,
            request.MaxLat,
            ct);

        return Result<IReadOnlyList<PlaceMapItemDto>>.Success(places);
    }
}
