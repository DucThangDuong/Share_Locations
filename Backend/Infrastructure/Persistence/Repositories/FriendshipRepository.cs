using Domain.Entities;
using Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class FriendshipRepository : IFriendshipRepository
{
    private readonly TravelReviewDbContext _dbContext;

    public FriendshipRepository(TravelReviewDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Friendship?> GetFriendshipAsync(long user1Id, long user2Id, CancellationToken ct = default)
    {
        var minId = Math.Min(user1Id, user2Id);
        var maxId = Math.Max(user1Id, user2Id);

        return await _dbContext.Friendships
            .Include(f => f.User1)
                .ThenInclude(u => u.Profile)
            .Include(f => f.User2)
                .ThenInclude(u => u.Profile)
            .FirstOrDefaultAsync(f => f.User1Id == minId && f.User2Id == maxId, ct);
    }

    public async Task AddAsync(Friendship friendship, CancellationToken ct = default)
    {
        await _dbContext.Friendships.AddAsync(friendship, ct);
    }

    public void Remove(Friendship friendship)
    {
        _dbContext.Friendships.Remove(friendship);
    }

    public async Task<List<Friendship>> GetUserFriendshipsAsync(long userId, CancellationToken ct = default)
    {
        return await _dbContext.Friendships
            .AsNoTracking()
            .Where(f => f.User1Id == userId || f.User2Id == userId)
            .Include(f => f.User1)
                .ThenInclude(u => u.Profile)
            .Include(f => f.User2)
                .ThenInclude(u => u.Profile)
            .ToListAsync(ct);
    }
}
