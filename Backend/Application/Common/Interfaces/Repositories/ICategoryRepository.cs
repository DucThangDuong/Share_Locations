using Application.DTOs;

namespace Application.Common.Interfaces.Repositories;

public interface ICategoryRepository
{
    Task<IReadOnlyList<CategoryDto>> GetAllAsync(int? placeTypeId = null, int placesPerCategory = 6, CancellationToken ct = default);
}
