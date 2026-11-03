using Application.Common;
using Application.DTOs;

namespace Application.Common.Interfaces.Repositories;

public interface IRegionRepository
{
    Task<IReadOnlyList<RegionDto>> GetAllAsync(CancellationToken ct = default);
    Task<RegionLandingDto?> GetRegionLandingAsync(string regionCode, CancellationToken ct = default);
    Task<PagedResult<RegionHeroImageDto>> GetRegionPhotosAsync(string regionCode, int page, int pageSize, CancellationToken ct = default);
}
