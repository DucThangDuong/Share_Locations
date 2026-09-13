using Domain.Entities;

namespace Domain.Interfaces;

public interface IVisitLogRepository
{
    Task<VisitLog?> GetByIdAsync(long id, CancellationToken ct = default);
    Task<VisitLog?> GetByUserAndPlaceAsync(long userId, long placeId, CancellationToken ct = default);
    Task AddAsync(VisitLog visitLog, CancellationToken ct = default);
    void Remove(VisitLog visitLog);
}
