using Domain.Entities;
using Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class VisitLogRepository : IVisitLogRepository
{
    private readonly TravelReviewDbContext _dbContext;

    public VisitLogRepository(TravelReviewDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<VisitLog?> GetByIdAsync(long id, CancellationToken ct = default)
    {
        return await _dbContext.VisitLogs
            .Include(v => v.Place)
            .FirstOrDefaultAsync(v => v.Id == id, ct);
    }

    public async Task<VisitLog?> GetByUserAndPlaceAsync(long userId, long placeId, CancellationToken ct = default)
    {
        return await _dbContext.VisitLogs
            .FirstOrDefaultAsync(v => v.UserId == userId && v.PlaceId == placeId, ct);
    }

    public async Task AddAsync(VisitLog visitLog, CancellationToken ct = default)
    {
        await _dbContext.VisitLogs.AddAsync(visitLog, ct);
    }

    public void Remove(VisitLog visitLog)
    {
        _dbContext.VisitLogs.Remove(visitLog);
    }
}
