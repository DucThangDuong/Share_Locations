namespace Domain.Interfaces;

public interface IUnitOfWork : IDisposable
{
    IUserRepository Users { get; }
    IUserProfileRepository UserProfiles { get; }
    IPlaceWriteRepository Places { get; }
    IReviewRepository Reviews { get; }
    IFavoriteRepository Favorites { get; }
    IPlaceReportRepository PlaceReports { get; }
    IReportTypeRepository ReportTypes { get; }
    ICommentRepository Comments { get; }
    IProposalRepository Proposals { get; }
    IVisitLogRepository VisitLogs { get; }
    IAccessHistoryRepository AccessHistories { get; }
    IBlogWriteRepository Blogs { get; }

    Task<int> SaveChangesAsync(CancellationToken ct = default);
    Task ExecuteInTransactionAsync(Func<Task> action, CancellationToken ct = default);
}
