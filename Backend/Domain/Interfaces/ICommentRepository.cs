using Domain.Entities;

namespace Domain.Interfaces;

public interface ICommentRepository
{
    Task AddAsync(Comment comment, CancellationToken ct = default);
    Task<Comment?> GetByIdAsync(long id, CancellationToken ct = default);
    Task<IReadOnlyList<Comment>> GetByReviewIdAsync(long reviewId, CancellationToken ct = default);
    void Update(Comment comment);
    void Delete(Comment comment);
}
