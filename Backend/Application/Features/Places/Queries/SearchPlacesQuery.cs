using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Places.Queries;

public record SearchPlacesQuery(PlaceFilterParams FilterParams) : IRequest<Result<PagedResult<PlaceSummaryDto>>>;

public class SearchPlacesQueryHandler : IRequestHandler<SearchPlacesQuery, Result<PagedResult<PlaceSummaryDto>>>
{
    private readonly IPlaceRepository _placeRepository;
    private readonly ICacheService _cacheService;

    public SearchPlacesQueryHandler(IPlaceRepository placeRepository, ICacheService cacheService)
    {
        _placeRepository = placeRepository;
        _cacheService = cacheService;
    }

    public async Task<Result<PagedResult<PlaceSummaryDto>>> Handle(SearchPlacesQuery request, CancellationToken ct)
    {
        var p = request.FilterParams;
        var cacheKey = $"places:search:{p.Keyword?.Trim().ToLowerInvariant()}:{p.RegionId}:{p.ProvinceId}:{p.CategoryId}:{p.PlaceTypeId}:{p.MinPrice}:{p.MaxPrice}:{p.MinRating}:{p.SortBy}:{p.Page}:{p.PageSize}";

        var cached = await _cacheService.GetAsync<PagedResult<PlaceSummaryDto>>(cacheKey, ct);
        if (cached != null)
        {
            return Result<PagedResult<PlaceSummaryDto>>.Success(cached);
        }

        var (places, totalCount) = await _placeRepository.SearchAndFilterAsync(p, ct);

        var pagedResult = new PagedResult<PlaceSummaryDto>(
            places,
            totalCount,
            p.Page,
            p.PageSize);

        await _cacheService.SetAsync(cacheKey, pagedResult, TimeSpan.FromMinutes(5), ct);

        return Result<PagedResult<PlaceSummaryDto>>.Success(pagedResult);
    }
}
