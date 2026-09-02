using Application.DTOs;

namespace Application.Common.Interfaces.Repositories;

public interface ICategoryRepository
{
    Task<IReadOnlyList<CategoryDto>> GetAllAsync(CancellationToken ct = default);
}
