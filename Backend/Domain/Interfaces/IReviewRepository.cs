using Domain.Entities;

namespace Domain.Interfaces;

public interface IReviewRepository
{
    Task AddAsync(Review review, CancellationToken ct = default);
    Task<(decimal AvgRating, int ReviewCount)> GetPlaceStatsAsync(long placeId, CancellationToken ct = default);
}
