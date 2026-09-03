using Application.DTOs;

namespace Application.Common.Interfaces.Repositories;

public interface IPlaceTypeRepository
{
    Task<IReadOnlyList<PlaceTypeDto>> GetAllAsync(CancellationToken ct = default);
}
