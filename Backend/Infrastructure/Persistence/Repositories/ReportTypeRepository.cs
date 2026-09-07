using Domain.Entities;
using Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class ReportTypeRepository : IReportTypeRepository
{
    private readonly TravelReviewDbContext _dbContext;

    public ReportTypeRepository(TravelReviewDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<ReportType?> GetDefaultAsync(CancellationToken ct = default)
    {
        return await _dbContext.ReportTypes
            .AsNoTracking()
            .Where(r => r.IsActive)
            .OrderBy(r => r.DisplayOrder)
            .FirstOrDefaultAsync(ct);
    }
}
