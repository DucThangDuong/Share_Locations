using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Rankings.Queries;

public record GetPlaceRankingsQuery(
    int? PlaceTypeId = null,
    int? CategoryId = null,
    int? ProvinceId = null,
    int? RegionId = null,
    string Period = "all_time",
    int Limit = 10) : IRequest<Result<IReadOnlyList<PlaceRankingItemDto>>>;

public class GetPlaceRankingsQueryHandler : IRequestHandler<GetPlaceRankingsQuery, Result<IReadOnlyList<PlaceRankingItemDto>>>
{
    private readonly IRankingRepository _rankingRepository;
    private readonly ICacheService _cacheService;

    public GetPlaceRankingsQueryHandler(IRankingRepository rankingRepository, ICacheService cacheService)
    {
        _rankingRepository = rankingRepository;
        _cacheService = cacheService;
    }

    public async Task<Result<IReadOnlyList<PlaceRankingItemDto>>> Handle(GetPlaceRankingsQuery request, CancellationToken ct)
    {
        var safeLimit = Math.Clamp(request.Limit, 1, 50);
        var cacheKey = $"rank:places:pt_{request.PlaceTypeId?.ToString() ?? "all"}:cat_{request.CategoryId?.ToString() ?? "all"}:prov_{request.ProvinceId?.ToString() ?? "all"}:reg_{request.RegionId?.ToString() ?? "all"}:p_{request.Period}:{safeLimit}";

        var cached = await _cacheService.GetAsync<IReadOnlyList<PlaceRankingItemDto>>(cacheKey, ct);
        if (cached != null)
        {
            return Result<IReadOnlyList<PlaceRankingItemDto>>.Success(cached);
        }

        var places = await _rankingRepository.GetPlaceRankingsAsync(
            request.PlaceTypeId,
            request.CategoryId,
            request.ProvinceId,
            request.RegionId,
            request.Period,
            safeLimit,
            ct);

        await _cacheService.SetAsync(cacheKey, places, TimeSpan.FromMinutes(30), ct);

        return Result<IReadOnlyList<PlaceRankingItemDto>>.Success(places);
    }
}
