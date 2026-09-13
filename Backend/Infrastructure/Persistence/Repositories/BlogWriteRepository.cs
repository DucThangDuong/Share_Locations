using Domain.Entities;
using Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class BlogWriteRepository : IBlogWriteRepository
{
    private readonly TravelReviewDbContext _dbContext;

    public BlogWriteRepository(TravelReviewDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Blog?> GetByIdAsync(long id, CancellationToken ct = default)
    {
        return await _dbContext.Blogs
            .Include(b => b.Category)
            .FirstOrDefaultAsync(b => b.Id == id, ct);
    }

    public async Task AddAsync(Blog blog, CancellationToken ct = default)
    {
        await _dbContext.Blogs.AddAsync(blog, ct);
    }

    public void Remove(Blog blog)
    {
        _dbContext.Blogs.Remove(blog);
    }
}
