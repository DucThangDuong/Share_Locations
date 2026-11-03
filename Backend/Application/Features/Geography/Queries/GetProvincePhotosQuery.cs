using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Geography.Queries;

public record GetProvincePhotosQuery(string IdOrSlug, int Page = 1, int PageSize = 20) : IRequest<Result<PagedResult<RegionHeroImageDto>>>;

public class GetProvincePhotosQueryHandler : IRequestHandler<GetProvincePhotosQuery, Result<PagedResult<RegionHeroImageDto>>>
{
    private readonly IProvinceRepository _provinceRepository;

    public GetProvincePhotosQueryHandler(IProvinceRepository provinceRepository)
    {
        _provinceRepository = provinceRepository;
    }

    public async Task<Result<PagedResult<RegionHeroImageDto>>> Handle(GetProvincePhotosQuery request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.IdOrSlug))
        {
            return Result<PagedResult<RegionHeroImageDto>>.NotFound("Mã hoặc tên tỉnh thành không hợp lệ.");
        }

        var photos = await _provinceRepository.GetProvincePhotosAsync(request.IdOrSlug, request.Page, request.PageSize, ct);
        return Result<PagedResult<RegionHeroImageDto>>.Success(photos, "Lấy danh sách hình ảnh tỉnh thành thành công");
    }
}

