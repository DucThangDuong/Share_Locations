using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class FavoriteRepository : IFavoriteRepository
{
    private readonly TravelReviewDbContext _dbContext;

    public FavoriteRepository(TravelReviewDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Favorite?> GetAsync(long userId, long targetId, FavoriteTargetType targetType, CancellationToken ct = default)
    {
        return await _dbContext.Favorites
            .FirstOrDefaultAsync(f => f.UserId == userId && f.TargetId == targetId && f.TargetType == targetType, ct);
    }

    public async Task<bool> ExistsAsync(long userId, long targetId, FavoriteTargetType targetType, CancellationToken ct = default)
    {
        return await _dbContext.Favorites
            .AnyAsync(f => f.UserId == userId && f.TargetId == targetId && f.TargetType == targetType, ct);
    }

    public async Task AddAsync(Favorite favorite, CancellationToken ct = default)
    {
        await _dbContext.Favorites.AddAsync(favorite, ct);
    }

    public void Remove(Favorite favorite)
    {
        _dbContext.Favorites.Remove(favorite);
    }
}
