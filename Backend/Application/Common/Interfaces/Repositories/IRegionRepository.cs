using Application.DTOs;

namespace Application.Common.Interfaces.Repositories;

public interface IRegionRepository
{
    Task<IReadOnlyList<RegionDto>> GetAllAsync(CancellationToken ct = default);
    Task<RegionLandingDto?> GetRegionLandingAsync(string regionCode, CancellationToken ct = default);
}
