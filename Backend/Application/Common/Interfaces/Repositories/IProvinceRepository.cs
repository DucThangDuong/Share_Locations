using Application.Common;
using Application.DTOs;

namespace Application.Common.Interfaces.Repositories;

public interface IProvinceRepository
{
    Task<IReadOnlyList<ProvinceDto>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<ProvinceLandingDto?> GetProvinceLandingAsync(string idOrSlug, CancellationToken ct = default);
    Task<PagedResult<RegionHeroImageDto>> GetProvincePhotosAsync(string idOrSlug, int page, int pageSize, CancellationToken ct = default);
}
