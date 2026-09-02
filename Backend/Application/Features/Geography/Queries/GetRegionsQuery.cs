using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Geography.Queries;

public record GetRegionsQuery() : IRequest<Result<IReadOnlyList<RegionDto>>>;

public class GetRegionsQueryHandler : IRequestHandler<GetRegionsQuery, Result<IReadOnlyList<RegionDto>>>
{
    private readonly IRegionRepository _regionRepository;
    private readonly ICacheService _cacheService;

    public GetRegionsQueryHandler(IRegionRepository regionRepository, ICacheService cacheService)
    {
        _regionRepository = regionRepository;
        _cacheService = cacheService;
    }

    public async Task<Result<IReadOnlyList<RegionDto>>> Handle(GetRegionsQuery request, CancellationToken ct)
    {
        const string cacheKey = "geography:regions:all";

        var cached = await _cacheService.GetAsync<IReadOnlyList<RegionDto>>(cacheKey, ct);
        if (cached != null && cached.Count > 0)
        {
            return Result<IReadOnlyList<RegionDto>>.Success(cached);
        }

        var regions = await _regionRepository.GetAllAsync(ct);

        if (regions.Count > 0)
        {
            await _cacheService.SetAsync(cacheKey, regions, TimeSpan.FromHours(24), ct);
        }

        return Result<IReadOnlyList<RegionDto>>.Success(regions);
    }
}
