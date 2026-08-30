using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class UserProfileRepository : IUserProfileRepository
{
    private readonly TravelReviewDbContext _dbContext;

    public UserProfileRepository(TravelReviewDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<UserProfile?> GetByUserIdAsync(long userId, CancellationToken ct = default)
    {
        return await _dbContext.UserProfiles.FirstOrDefaultAsync(p => p.UserId == userId, ct);
    }

    public async Task AddAsync(UserProfile profile, CancellationToken ct = default)
    {
        await _dbContext.UserProfiles.AddAsync(profile, ct);
    }

    public void Update(UserProfile profile)
    {
        _dbContext.UserProfiles.Update(profile);
    }

    public void Delete(UserProfile profile)
    {
        _dbContext.UserProfiles.Remove(profile);
    }
}
