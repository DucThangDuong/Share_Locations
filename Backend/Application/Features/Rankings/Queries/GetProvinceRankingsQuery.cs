using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Rankings.Queries;

public record GetProvinceRankingsQuery(
    int? RegionId = null,
    int Limit = 10,
    bool IncludeExcluded = false) : IRequest<Result<IReadOnlyList<ProvinceRankingItemDto>>>;

public class GetProvinceRankingsQueryHandler : IRequestHandler<GetProvinceRankingsQuery, Result<IReadOnlyList<ProvinceRankingItemDto>>>
{
    private readonly IRankingRepository _rankingRepository;
    private readonly ICacheService _cacheService;

    public GetProvinceRankingsQueryHandler(IRankingRepository rankingRepository, ICacheService cacheService)
    {
        _rankingRepository = rankingRepository;
        _cacheService = cacheService;
    }

    public async Task<Result<IReadOnlyList<ProvinceRankingItemDto>>> Handle(GetProvinceRankingsQuery request, CancellationToken ct)
    {
        var safeLimit = Math.Clamp(request.Limit, 1, 50);
        var cacheKey = $"rank:provinces:reg_{request.RegionId?.ToString() ?? "all"}:ex_{request.IncludeExcluded}:{safeLimit}";

        if (!request.IncludeExcluded)
        {
            var cached = await _cacheService.GetAsync<IReadOnlyList<ProvinceRankingItemDto>>(cacheKey, ct);
            if (cached != null)
            {
                return Result<IReadOnlyList<ProvinceRankingItemDto>>.Success(cached);
            }
        }

        var provinces = await _rankingRepository.GetProvinceRankingsAsync(request.RegionId, safeLimit, request.IncludeExcluded, ct);

        if (!request.IncludeExcluded)
        {
            await _cacheService.SetAsync(cacheKey, provinces, TimeSpan.FromHours(1), ct);
        }

        return Result<IReadOnlyList<ProvinceRankingItemDto>>.Success(provinces);
    }
}
