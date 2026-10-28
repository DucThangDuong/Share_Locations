using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Itineraries.Queries;

public record GetItinerariesQuery(ItineraryFilterParams FilterParams) : IRequest<Result<PagedResult<ItineraryDto>>>
{
    public GetItinerariesQuery(
        string? destination = null,
        string? duration = null,
        string? budget = null,
        string? keyword = null,
        int page = 1,
        int pageSize = 12,
        long? userId = null) : this(new ItineraryFilterParams
        {
            Destination = destination,
            Duration = duration,
            Budget = budget,
            Keyword = keyword,
            Page = page,
            PageSize = pageSize,
            UserId = userId
        })
    {
    }
}

public class GetItinerariesQueryHandler : IRequestHandler<GetItinerariesQuery, Result<PagedResult<ItineraryDto>>>
{
    private readonly ITripRepository _tripRepository;

    public GetItinerariesQueryHandler(ITripRepository tripRepository)
    {
        _tripRepository = tripRepository;
    }

    public async Task<Result<PagedResult<ItineraryDto>>> Handle(GetItinerariesQuery request, CancellationToken ct)
    {
        var pagedResult = await _tripRepository.GetItinerariesAsync(request.FilterParams, ct);

        if (request.FilterParams.UserId.HasValue && pagedResult.Items.Count > 0)
        {
            foreach (var item in pagedResult.Items)
            {
                item.IsSaved = await _tripRepository.IsItinerarySavedAsync(request.FilterParams.UserId.Value, item.Id, ct);
            }
        }

        return Result<PagedResult<ItineraryDto>>.Success(pagedResult);
    }
}
