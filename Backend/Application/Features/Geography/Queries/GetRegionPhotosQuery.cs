using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Geography.Queries;

public record GetRegionPhotosQuery(string RegionSlug, int Page = 1, int PageSize = 20) : IRequest<Result<PagedResult<RegionHeroImageDto>>>;

public class GetRegionPhotosQueryHandler : IRequestHandler<GetRegionPhotosQuery, Result<PagedResult<RegionHeroImageDto>>>
{
    private readonly IRegionRepository _regionRepository;

    public GetRegionPhotosQueryHandler(IRegionRepository regionRepository)
    {
        _regionRepository = regionRepository;
    }

    public async Task<Result<PagedResult<RegionHeroImageDto>>> Handle(GetRegionPhotosQuery request, CancellationToken ct)
    {
        var normalizedCode = GetRegionLandingQueryHandler.NormalizeRegionCode(request.RegionSlug);
        if (string.IsNullOrEmpty(normalizedCode))
        {
            return Result<PagedResult<RegionHeroImageDto>>.NotFound(
                $"Không tìm thấy dữ liệu vùng miền cho '{request.RegionSlug}'.");
        }

        var photos = await _regionRepository.GetRegionPhotosAsync(normalizedCode, request.Page, request.PageSize, ct);
        return Result<PagedResult<RegionHeroImageDto>>.Success(photos, "Lấy danh sách hình ảnh vùng miền thành công");
    }
}

