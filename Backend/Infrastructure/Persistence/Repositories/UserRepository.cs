using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class UserRepository : IUserRepository
{
    private readonly TravelReviewDbContext _dbContext;

    public UserRepository(TravelReviewDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<User?> GetByIdAsync(long id, CancellationToken ct = default)
    {
        return await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == id, ct);
    }

    public async Task<User?> GetByEmailAsync(string email, CancellationToken ct = default)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        return await _dbContext.Users
            .Include(u => u.Profile)
            .FirstOrDefaultAsync(u => u.Email == normalizedEmail && !u.IsDeleted, ct);
    }

    public async Task<User?> GetByGoogleIdAsync(string googleId, CancellationToken ct = default)
    {
        return await _dbContext.Users
            .Include(u => u.Profile)
            .FirstOrDefaultAsync(u => u.Profile != null && u.Profile.GoogleId == googleId && !u.IsDeleted, ct);
    }

    public async Task<User?> GetByIdWithProfileAsync(long id, CancellationToken ct = default)
    {
        return await _dbContext.Users
            .Include(u => u.Profile)
            .FirstOrDefaultAsync(u => u.Id == id && !u.IsDeleted, ct);
    }

    public async Task<bool> IsEmailUniqueAsync(string email, CancellationToken ct = default)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        return !await _dbContext.Users.AnyAsync(u => u.Email == normalizedEmail && !u.IsDeleted, ct);
    }

    public async Task<List<User>> SearchUsersAsync(string keyword, int limit = 30, CancellationToken ct = default)
    {
        var raw = (keyword ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(raw))
            return new List<User>();

        var query = _dbContext.Users
            .AsNoTracking()
            .Include(u => u.Profile)
            .Include(u => u.Trips)
            .Where(u => !u.IsDeleted && u.Status == UserStatus.Active);

        if (raw.StartsWith("#") && long.TryParse(raw.TrimStart('#').Trim(), out var parsedId))
        {
            query = query.Where(u => u.Id == parsedId);
        }
        else if (long.TryParse(raw, out var numericId))
        {
            query = query.Where(u => u.Id == numericId 
                || (u.Profile != null && EF.Functions.Like(u.Profile.FullName, $"%{raw}%")) 
                || EF.Functions.Like(u.Email, $"%{raw}%"));
        }
        else
        {
            query = query.Where(u => 
                (u.Profile != null && EF.Functions.Like(u.Profile.FullName, $"%{raw}%")) 
                || EF.Functions.Like(u.Email, $"%{raw}%"));
        }

        return await query.OrderByDescending(u => u.Profile != null ? u.Profile.ReputationScore : 0).ThenBy(u => u.Id).Take(limit).ToListAsync(ct);
    }

    public async Task AddAsync(User user, CancellationToken ct = default)
    {
        await _dbContext.Users.AddAsync(user, ct);
    }

    public void Update(User user)
    {
        _dbContext.Users.Update(user);
    }

    public void Delete(User user)
    {
        _dbContext.Users.Remove(user);
    }
}
