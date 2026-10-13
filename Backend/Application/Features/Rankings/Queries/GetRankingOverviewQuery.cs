using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Rankings.Queries;

public record GetRankingOverviewQuery() : IRequest<Result<RankingOverviewDto>>;

public class GetRankingOverviewQueryHandler : IRequestHandler<GetRankingOverviewQuery, Result<RankingOverviewDto>>
{
    private readonly IRankingRepository _rankingRepository;
    private readonly ICacheService _cacheService;

    public GetRankingOverviewQueryHandler(IRankingRepository rankingRepository, ICacheService cacheService)
    {
        _rankingRepository = rankingRepository;
        _cacheService = cacheService;
    }

    public async Task<Result<RankingOverviewDto>> Handle(GetRankingOverviewQuery request, CancellationToken ct)
    {
        const string cacheKey = "rank:overview";

        var cached = await _cacheService.GetAsync<RankingOverviewDto>(cacheKey, ct);
        if (cached != null)
        {
            return Result<RankingOverviewDto>.Success(cached);
        }

        var overview = await _rankingRepository.GetRankingOverviewAsync(ct);

        await _cacheService.SetAsync(cacheKey, overview, TimeSpan.FromHours(1), ct);

        return Result<RankingOverviewDto>.Success(overview);
    }
}
