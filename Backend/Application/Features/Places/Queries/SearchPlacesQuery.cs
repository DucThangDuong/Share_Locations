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

    public SearchPlacesQueryHandler(IPlaceRepository placeRepository)
    {
        _placeRepository = placeRepository;
    }

    public async Task<Result<PagedResult<PlaceSummaryDto>>> Handle(SearchPlacesQuery request, CancellationToken ct)
    {
        var p = request.FilterParams;
        var (places, totalCount) = await _placeRepository.SearchAndFilterAsync(p, ct);

        var pagedResult = new PagedResult<PlaceSummaryDto>(
            places,
            totalCount,
            p.Page,
            p.PageSize);

        return Result<PagedResult<PlaceSummaryDto>>.Success(pagedResult);
    }
}
