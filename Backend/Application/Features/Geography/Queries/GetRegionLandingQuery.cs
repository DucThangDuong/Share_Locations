using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Geography.Queries;

public record GetRegionLandingQuery(string RegionSlug) : IRequest<Result<RegionLandingDto>>;

public class GetRegionLandingQueryHandler : IRequestHandler<GetRegionLandingQuery, Result<RegionLandingDto>>
{
    private readonly IRegionRepository _regionRepository;
    private readonly ICacheService _cacheService;

    public GetRegionLandingQueryHandler(IRegionRepository regionRepository, ICacheService cacheService)
    {
        _regionRepository = regionRepository;
        _cacheService = cacheService;
    }

    public async Task<Result<RegionLandingDto>> Handle(GetRegionLandingQuery request, CancellationToken ct)
    {
        var normalizedCode = NormalizeRegionCode(request.RegionSlug);
        if (string.IsNullOrEmpty(normalizedCode))
        {
            return Result<RegionLandingDto>.NotFound(
                $"Không tìm thấy dữ liệu vùng miền cho '{request.RegionSlug}'. Vui lòng chọn mien-bac (north), mien-trung (central), hoặc mien-nam (south).");
        }

        var cacheKey = $"geography:regions:landing:v3:{normalizedCode}";

        var cached = await _cacheService.GetAsync<RegionLandingDto>(cacheKey, ct);
        if (cached != null)
        {
            return Result<RegionLandingDto>.Success(cached, "Lấy dữ liệu vùng miền thành công");
        }

        var landingData = await _regionRepository.GetRegionLandingAsync(normalizedCode, ct);
        if (landingData == null)
        {
            return Result<RegionLandingDto>.NotFound(
                $"Không tìm thấy dữ liệu vùng miền cho '{request.RegionSlug}'.");
        }

        await _cacheService.SetAsync(cacheKey, landingData, TimeSpan.FromHours(1), ct);

        return Result<RegionLandingDto>.Success(landingData, "Lấy dữ liệu vùng miền thành công");
    }

    public static string? NormalizeRegionCode(string? slug)
    {
        if (string.IsNullOrWhiteSpace(slug)) return null;

        var s = slug.Trim().ToLowerInvariant().Replace("_", "-");

        if (s == "north" || s == "mien-bac" || s == "bac" || s == "bac-bo" || s.Contains("bắc") || s.Contains("bac"))
            return "north";

        if (s == "central" || s == "mien-trung" || s == "trung" || s == "trung-bo" || s.Contains("trung"))
            return "central";

        if (s == "south" || s == "mien-nam" || s == "nam" || s == "nam-bo" || s.Contains("nam"))
            return "south";

        return null;
    }
}
