using Application.DTOs;

namespace Application.Common.Interfaces.Repositories;

public interface IProvinceRepository
{
    Task<IReadOnlyList<ProvinceDto>> GetAllAsync(CancellationToken ct = default);
    Task<ProvinceLandingDto?> GetProvinceLandingAsync(string idOrSlug, CancellationToken ct = default);
}