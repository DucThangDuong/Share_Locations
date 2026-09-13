using Domain.Entities;

namespace Domain.Interfaces;

public interface IBlogWriteRepository
{
    Task<Blog?> GetByIdAsync(long id, CancellationToken ct = default);
    Task AddAsync(Blog blog, CancellationToken ct = default);
    void Remove(Blog blog);
}
