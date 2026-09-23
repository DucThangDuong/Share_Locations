using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Itineraries.Queries;

public record GetItinerariesQuery(ItineraryFilterParams FilterParams) : IRequest<Result<IReadOnlyList<ItineraryDto>>>
{
    public GetItinerariesQuery(
        string? duration = null,
        string? keyword = null,
        int page = 1,
        int pageSize = 10,
        long? userId = null) : this(new ItineraryFilterParams
        {
            Duration = duration,
            Keyword = keyword,
            Page = page,
            PageSize = pageSize,
            UserId = userId
        })
    {
    }
}

public class GetItinerariesQueryHandler : IRequestHandler<GetItinerariesQuery, Result<IReadOnlyList<ItineraryDto>>>
{
    private readonly ITripRepository _tripRepository;

    public GetItinerariesQueryHandler(ITripRepository tripRepository)
    {
        _tripRepository = tripRepository;
    }

    public async Task<Result<IReadOnlyList<ItineraryDto>>> Handle(GetItinerariesQuery request, CancellationToken ct)
    {
        var itineraries = await _tripRepository.GetItinerariesAsync(request.FilterParams, ct);

        if (request.FilterParams.UserId.HasValue && itineraries.Count > 0)
        {
            foreach (var item in itineraries)
            {
                item.IsSaved = await _tripRepository.IsItinerarySavedAsync(request.FilterParams.UserId.Value, item.Id, ct);
            }
        }

        return Result<IReadOnlyList<ItineraryDto>>.Success(itineraries);
    }
}
