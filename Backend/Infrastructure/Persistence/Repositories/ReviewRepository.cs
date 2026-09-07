using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class ReviewRepository : IReviewRepository
{
    private readonly TravelReviewDbContext _dbContext;

    public ReviewRepository(TravelReviewDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task AddAsync(Review review, CancellationToken ct = default)
    {
        await _dbContext.Reviews.AddAsync(review, ct);
    }

    public async Task<(decimal AvgRating, int ReviewCount)> GetPlaceStatsAsync(long placeId, CancellationToken ct = default)
    {
        var ratings = await _dbContext.Reviews
            .Where(r => r.PlaceId == placeId && r.Status == ReviewStatus.Active)
            .Select(r => (decimal)r.Rating)
            .ToListAsync(ct);

        if (ratings.Count == 0)
        {
            return (0m, 0);
        }

        var avg = Math.Round(ratings.Average(), 2);
        return (avg, ratings.Count);
    }
}
