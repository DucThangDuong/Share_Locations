using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Geography.Queries;

public record GetProvincesQuery() : IRequest<Result<IReadOnlyList<ProvinceDto>>>;

public class GetProvincesQueryHandler : IRequestHandler<GetProvincesQuery, Result<IReadOnlyList<ProvinceDto>>>
{
    private readonly IProvinceRepository _provinceRepository;
    private readonly ICacheService _cacheService;

    public GetProvincesQueryHandler(IProvinceRepository provinceRepository, ICacheService cacheService)
    {
        _provinceRepository = provinceRepository;
        _cacheService = cacheService;
    }

    public async Task<Result<IReadOnlyList<ProvinceDto>>> Handle(GetProvincesQuery request, CancellationToken ct)
    {
        const string cacheKey = "geography:provinces:all";

        var cached = await _cacheService.GetAsync<IReadOnlyList<ProvinceDto>>(cacheKey, ct);
        if (cached != null && cached.Count > 0)
        {
            return Result<IReadOnlyList<ProvinceDto>>.Success(cached);
        }

        var provinces = await _provinceRepository.GetAllAsync(ct);

        if (provinces.Count > 0)
        {
            await _cacheService.SetAsync(cacheKey, provinces, TimeSpan.FromHours(12), ct);
        }

        return Result<IReadOnlyList<ProvinceDto>>.Success(provinces);
    }
}
