using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Places.Queries;

public record GetRelatedPlacesQuery(long PlaceId, int Limit = 6) : IRequest<Result<IReadOnlyList<PlaceSummaryDto>>>;

public class GetRelatedPlacesQueryHandler : IRequestHandler<GetRelatedPlacesQuery, Result<IReadOnlyList<PlaceSummaryDto>>>
{
    private readonly IPlaceRepository _placeRepository;
    private readonly ICacheService _cacheService;

    public GetRelatedPlacesQueryHandler(IPlaceRepository placeRepository, ICacheService cacheService)
    {
        _placeRepository = placeRepository;
        _cacheService = cacheService;
    }

    public async Task<Result<IReadOnlyList<PlaceSummaryDto>>> Handle(GetRelatedPlacesQuery request, CancellationToken ct)
    {
        var safeLimit = Math.Clamp(request.Limit, 1, 20);
        var cacheKey = $"places:related:{request.PlaceId}:{safeLimit}";

        var cached = await _cacheService.GetAsync<IReadOnlyList<PlaceSummaryDto>>(cacheKey, ct);
        if (cached != null)
        {
            return Result<IReadOnlyList<PlaceSummaryDto>>.Success(cached);
        }

        var places = await _placeRepository.GetRelatedPlacesAsync(request.PlaceId, safeLimit, ct);

        await _cacheService.SetAsync(cacheKey, places, TimeSpan.FromMinutes(30), ct);

        return Result<IReadOnlyList<PlaceSummaryDto>>.Success(places);
    }
}
