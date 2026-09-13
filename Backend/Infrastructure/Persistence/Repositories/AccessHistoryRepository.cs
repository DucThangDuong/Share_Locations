using Domain.Entities;
using Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class AccessHistoryRepository : IAccessHistoryRepository
{
    private readonly TravelReviewDbContext _dbContext;

    public AccessHistoryRepository(TravelReviewDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<AccessHistory?> GetByUserAndPlaceAsync(long userId, long placeId, CancellationToken ct = default)
    {
        return await _dbContext.AccessHistories
            .FirstOrDefaultAsync(a => a.UserId == userId && a.PlaceId == placeId, ct);
    }

    public async Task AddAsync(AccessHistory accessHistory, CancellationToken ct = default)
    {
        await _dbContext.AccessHistories.AddAsync(accessHistory, ct);
    }
}
