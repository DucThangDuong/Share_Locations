using Domain.Entities;

namespace Domain.Interfaces;

public interface IAccessHistoryRepository
{
    Task<AccessHistory?> GetByUserAndPlaceAsync(long userId, long placeId, CancellationToken ct = default);
    Task AddAsync(AccessHistory accessHistory, CancellationToken ct = default);
}
