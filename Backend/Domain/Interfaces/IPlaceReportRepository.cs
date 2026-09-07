using Domain.Entities;

namespace Domain.Interfaces;

public interface IPlaceReportRepository
{
    Task AddAsync(PlaceReport report, CancellationToken ct = default);
}
