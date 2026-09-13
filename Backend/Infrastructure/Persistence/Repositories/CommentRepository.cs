using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class CommentRepository : ICommentRepository
{
    private readonly TravelReviewDbContext _dbContext;

    public CommentRepository(TravelReviewDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task AddAsync(Comment comment, CancellationToken ct = default)
    {
        await _dbContext.Comments.AddAsync(comment, ct);
    }

    public async Task<Comment?> GetByIdAsync(long id, CancellationToken ct = default)
    {
        return await _dbContext.Comments
            .Include(c => c.User)
                .ThenInclude(u => u.Profile)
            .FirstOrDefaultAsync(c => c.Id == id && c.Status == CommentStatus.Active, ct);
    }

    public async Task<IReadOnlyList<Comment>> GetByReviewIdAsync(long reviewId, CancellationToken ct = default)
    {
        return await _dbContext.Comments
            .AsNoTracking()
            .Where(c => c.ReviewId == reviewId && c.Status == CommentStatus.Active)
            .Include(c => c.User)
                .ThenInclude(u => u.Profile)
            .OrderBy(c => c.CreatedAt)
            .ToListAsync(ct);
    }

    public void Update(Comment comment)
    {
        _dbContext.Comments.Update(comment);
    }

    public void Delete(Comment comment)
    {
        _dbContext.Comments.Remove(comment);
    }

    public async Task HideByReviewIdAsync(long reviewId, CancellationToken ct = default)
    {
        var comments = await _dbContext.Comments
            .Where(c => c.ReviewId == reviewId && c.Status == CommentStatus.Active)
            .ToListAsync(ct);

        foreach (var comment in comments)
        {
            comment.Hide();
        }
    }

    public async Task HideRepliesAsync(long parentCommentId, CancellationToken ct = default)
    {
        var parent = await _dbContext.Comments.FindAsync(new object[] { parentCommentId }, ct);
        if (parent == null) return;

        var comments = await _dbContext.Comments
            .Where(c => c.ReviewId == parent.ReviewId && c.Status == CommentStatus.Active)
            .ToListAsync(ct);

        var lookup = comments.ToLookup(c => c.ParentId);
        var queue = new Queue<long>();
        var visited = new HashSet<long> { parentCommentId };
        queue.Enqueue(parentCommentId);

        while (queue.Count > 0)
        {
            var currentId = queue.Dequeue();
            foreach (var child in lookup[currentId])
            {
                if (visited.Add(child.Id))
                {
                    child.Hide();
                    queue.Enqueue(child.Id);
                }
            }
        }
    }
}
