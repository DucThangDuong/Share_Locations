using Domain.Interfaces;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly TravelReviewDbContext _dbContext;

    private IUserRepository? _users;
    public IUserRepository Users => _users ??= new UserRepository(_dbContext);

    private IUserProfileRepository? _userProfiles;
    public IUserProfileRepository UserProfiles => _userProfiles ??= new UserProfileRepository(_dbContext);

    public UnitOfWork(TravelReviewDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        return await _dbContext.SaveChangesAsync(ct);
    }

    public async Task ExecuteInTransactionAsync(Func<Task> action, CancellationToken ct = default)
    {
        var strategy = _dbContext.Database.CreateExecutionStrategy();
        await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await _dbContext.Database.BeginTransactionAsync(ct);
            await action();
            await _dbContext.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
        });
    }

    public void Dispose()
    {
        _dbContext.Dispose();
        GC.SuppressFinalize(this);
    }
}
