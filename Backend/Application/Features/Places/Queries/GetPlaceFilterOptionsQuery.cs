using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Places.Queries;

public record GetPlaceFilterOptionsQuery() : IRequest<Result<PlaceFilterOptionsDto>>;

public class GetPlaceFilterOptionsQueryHandler : IRequestHandler<GetPlaceFilterOptionsQuery, Result<PlaceFilterOptionsDto>>
{
    private readonly IPlaceRepository _placeRepository;
    private readonly ICacheService _cacheService;

    public GetPlaceFilterOptionsQueryHandler(IPlaceRepository placeRepository, ICacheService cacheService)
    {
        _placeRepository = placeRepository;
        _cacheService = cacheService;
    }

    public async Task<Result<PlaceFilterOptionsDto>> Handle(GetPlaceFilterOptionsQuery request, CancellationToken ct)
    {
        const string cacheKey = "places:filter-options";

        var cached = await _cacheService.GetAsync<PlaceFilterOptionsDto>(cacheKey, ct);
        if (cached != null)
        {
            return Result<PlaceFilterOptionsDto>.Success(cached);
        }

        var filterOptions = await _placeRepository.GetFilterOptionsAsync(ct);

        await _cacheService.SetAsync(cacheKey, filterOptions, TimeSpan.FromHours(24), ct);

        return Result<PlaceFilterOptionsDto>.Success(filterOptions);
    }
}
