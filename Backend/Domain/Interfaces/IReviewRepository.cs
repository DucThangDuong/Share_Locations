using Domain.Entities;

namespace Domain.Interfaces;

public interface IReviewRepository
{
    Task AddAsync(Review review, CancellationToken ct = default);
    Task<Review?> GetByIdAsync(long id, CancellationToken ct = default);
    Task<bool> ExistsAsync(long id, CancellationToken ct = default);
    Task<(decimal AvgRating, int ReviewCount)> GetPlaceStatsAsync(long placeId, CancellationToken ct = default);
}
