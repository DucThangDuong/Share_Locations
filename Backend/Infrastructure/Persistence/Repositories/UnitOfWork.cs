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

    private IPlaceWriteRepository? _places;
    public IPlaceWriteRepository Places => _places ??= new PlaceWriteRepository(_dbContext);

    private IReviewRepository? _reviews;
    public IReviewRepository Reviews => _reviews ??= new ReviewRepository(_dbContext);

    private IFavoriteRepository? _favorites;
    public IFavoriteRepository Favorites => _favorites ??= new FavoriteRepository(_dbContext);

    private IPlaceReportRepository? _placeReports;
    public IPlaceReportRepository PlaceReports => _placeReports ??= new PlaceReportRepository(_dbContext);

    private IReportTypeRepository? _reportTypes;
    public IReportTypeRepository ReportTypes => _reportTypes ??= new ReportTypeRepository(_dbContext);

    private ICommentRepository? _comments;
    public ICommentRepository Comments => _comments ??= new CommentRepository(_dbContext);

    private IProposalRepository? _proposals;
    public IProposalRepository Proposals => _proposals ??= new ProposalRepository(_dbContext);

    private IVisitLogRepository? _visitLogs;
    public IVisitLogRepository VisitLogs => _visitLogs ??= new VisitLogRepository(_dbContext);

    private IAccessHistoryRepository? _accessHistories;
    public IAccessHistoryRepository AccessHistories => _accessHistories ??= new AccessHistoryRepository(_dbContext);

    private IBlogWriteRepository? _blogs;
    public IBlogWriteRepository Blogs => _blogs ??= new BlogWriteRepository(_dbContext);

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
