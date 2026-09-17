using Domain.Entities;

namespace Domain.Interfaces;

public interface IReviewRepository
{
    Task AddAsync(Review review, CancellationToken ct = default);
    Task<Review?> GetByIdAsync(long id, CancellationToken ct = default);
    Task<Review?> GetByIdWithMediaAsync(long id, CancellationToken ct = default);
    Task<bool> ExistsAsync(long id, CancellationToken ct = default);
    Task<(decimal AvgRating, int ReviewCount)> GetPlaceStatsAsync(long placeId, CancellationToken ct = default);
    Task<ReviewLike?> GetLikeAsync(long reviewId, long userId, CancellationToken ct = default);
    Task AddLikeAsync(ReviewLike like, CancellationToken ct = default);
    void RemoveLike(ReviewLike like);
    Task<bool> IsLikedAsync(long reviewId, long userId, CancellationToken ct = default);
    void Update(Review review);
    void Delete(Review review);
}
