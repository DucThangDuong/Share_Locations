using Domain.Entities;
using Domain.Interfaces;

namespace Infrastructure.Persistence.Repositories;

public class PlaceReportRepository : IPlaceReportRepository
{
    private readonly TravelReviewDbContext _dbContext;

    public PlaceReportRepository(TravelReviewDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task AddAsync(PlaceReport report, CancellationToken ct = default)
    {
        await _dbContext.PlaceReports.AddAsync(report, ct);
    }
}
