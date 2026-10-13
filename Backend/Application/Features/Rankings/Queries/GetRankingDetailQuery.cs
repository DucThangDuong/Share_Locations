using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Rankings.Queries;

public record GetRankingDetailQuery(
    string Type = "place_type",
    int? PlaceTypeId = null,
    int? ProvinceId = null,
    int? CategoryId = null,
    int Page = 1,
    int PageSize = 10) : IRequest<Result<RankingDetailViewDto>>;

public class GetRankingDetailQueryHandler : IRequestHandler<GetRankingDetailQuery, Result<RankingDetailViewDto>>
{
    private readonly IRankingRepository _rankingRepository;
    private readonly ICacheService _cacheService;

    public GetRankingDetailQueryHandler(IRankingRepository rankingRepository, ICacheService cacheService)
    {
        _rankingRepository = rankingRepository;
        _cacheService = cacheService;
    }

    public async Task<Result<RankingDetailViewDto>> Handle(GetRankingDetailQuery request, CancellationToken ct)
    {
        var safePage = Math.Max(1, request.Page);
        var safePageSize = Math.Clamp(request.PageSize, 1, 50);
        var cacheKey = $"rank:detail:{request.Type}:{request.PlaceTypeId?.ToString() ?? "all"}:{request.ProvinceId?.ToString() ?? "all"}:{request.CategoryId?.ToString() ?? "all"}:{safePage}:{safePageSize}";

        var cached = await _cacheService.GetAsync<RankingDetailViewDto>(cacheKey, ct);
        if (cached != null)
        {
            return Result<RankingDetailViewDto>.Success(cached);
        }

        var detail = await _rankingRepository.GetRankingDetailAsync(
            request.Type,
            request.PlaceTypeId,
            request.ProvinceId,
            request.CategoryId,
            safePage,
            safePageSize,
            ct);

        await _cacheService.SetAsync(cacheKey, detail, TimeSpan.FromMinutes(30), ct);

        return Result<RankingDetailViewDto>.Success(detail);
    }
}
