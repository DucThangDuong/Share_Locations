using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Catalog.Queries;

public record GetPlaceTypesQuery() : IRequest<Result<IReadOnlyList<PlaceTypeDto>>>;

public class GetPlaceTypesQueryHandler : IRequestHandler<GetPlaceTypesQuery, Result<IReadOnlyList<PlaceTypeDto>>>
{
    private readonly IPlaceTypeRepository _placeTypeRepository;
    private readonly ICacheService _cacheService;

    public GetPlaceTypesQueryHandler(IPlaceTypeRepository placeTypeRepository, ICacheService cacheService)
    {
        _placeTypeRepository = placeTypeRepository;
        _cacheService = cacheService;
    }

    public async Task<Result<IReadOnlyList<PlaceTypeDto>>> Handle(GetPlaceTypesQuery request, CancellationToken ct)
    {
        const string cacheKey = "catalog:placetypes:all";

        var cached = await _cacheService.GetAsync<IReadOnlyList<PlaceTypeDto>>(cacheKey, ct);
        if (cached != null && cached.Count > 0)
        {
            return Result<IReadOnlyList<PlaceTypeDto>>.Success(cached);
        }

        var placeTypes = await _placeTypeRepository.GetAllAsync(ct);

        if (placeTypes.Count > 0)
        {
            await _cacheService.SetAsync(cacheKey, placeTypes, TimeSpan.FromHours(24), ct);
        }

        return Result<IReadOnlyList<PlaceTypeDto>>.Success(placeTypes);
    }
}
