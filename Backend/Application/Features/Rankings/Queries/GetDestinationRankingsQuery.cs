using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Rankings.Queries;

public record GetDestinationRankingsQuery(
    int? RegionId = null,
    int? CategoryId = null,
    int Limit = 10) : IRequest<Result<IReadOnlyList<DestinationRankingItemDto>>>;

public class GetDestinationRankingsQueryHandler : IRequestHandler<GetDestinationRankingsQuery, Result<IReadOnlyList<DestinationRankingItemDto>>>
{
    private readonly IRankingRepository _rankingRepository;
    private readonly ICacheService _cacheService;

    public GetDestinationRankingsQueryHandler(IRankingRepository rankingRepository, ICacheService cacheService)
    {
        _rankingRepository = rankingRepository;
        _cacheService = cacheService;
    }

    public async Task<Result<IReadOnlyList<DestinationRankingItemDto>>> Handle(GetDestinationRankingsQuery request, CancellationToken ct)
    {
        var safeLimit = Math.Clamp(request.Limit, 1, 25);
        var cacheKey = $"rank:destinations:reg_{request.RegionId?.ToString() ?? "all"}:cat_{request.CategoryId?.ToString() ?? "all"}:{safeLimit}";

        var cached = await _cacheService.GetAsync<IReadOnlyList<DestinationRankingItemDto>>(cacheKey, ct);
        if (cached != null)
        {
            return Result<IReadOnlyList<DestinationRankingItemDto>>.Success(cached);
        }

        var destinations = await _rankingRepository.GetDestinationRankingsAsync(request.RegionId, request.CategoryId, safeLimit, ct);

        await _cacheService.SetAsync(cacheKey, destinations, TimeSpan.FromHours(1), ct);

        return Result<IReadOnlyList<DestinationRankingItemDto>>.Success(destinations);
    }
}
