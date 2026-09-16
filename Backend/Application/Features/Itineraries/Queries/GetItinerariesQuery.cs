using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Itineraries.Queries;

public record GetItinerariesQuery(
    string? Duration = null,
    string? Region = null,
    string? Keyword = null,
    int Page = 1,
    int PageSize = 10,
    long? UserId = null) : IRequest<Result<IReadOnlyList<ItineraryDto>>>;

public class GetItinerariesQueryHandler : IRequestHandler<GetItinerariesQuery, Result<IReadOnlyList<ItineraryDto>>>
{
    private readonly ITripRepository _tripRepository;

    public GetItinerariesQueryHandler(ITripRepository tripRepository)
    {
        _tripRepository = tripRepository;
    }

    public async Task<Result<IReadOnlyList<ItineraryDto>>> Handle(GetItinerariesQuery request, CancellationToken ct)
    {
        var itineraries = await _tripRepository.GetItinerariesAsync(
            request.Duration,
            request.Region,
            request.Keyword,
            request.Page,
            request.PageSize,
            ct);

        if (request.UserId.HasValue && itineraries.Count > 0)
        {
            foreach (var item in itineraries)
            {
                item.IsSaved = await _tripRepository.IsItinerarySavedAsync(request.UserId.Value, item.Id, ct);
            }
        }

        return Result<IReadOnlyList<ItineraryDto>>.Success(itineraries);
    }
}
