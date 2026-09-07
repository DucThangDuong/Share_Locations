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

    Task<int> SaveChangesAsync(CancellationToken ct = default);
    Task ExecuteInTransactionAsync(Func<Task> action, CancellationToken ct = default);
}
