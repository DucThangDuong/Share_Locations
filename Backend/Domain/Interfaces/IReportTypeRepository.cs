using Domain.Entities;

namespace Domain.Interfaces;

public interface IReportTypeRepository
{
    Task<ReportType?> GetDefaultAsync(CancellationToken ct = default);
}
