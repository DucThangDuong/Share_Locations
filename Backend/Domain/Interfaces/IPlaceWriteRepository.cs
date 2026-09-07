using Domain.Entities;

namespace Domain.Interfaces;

public interface IPlaceWriteRepository
{
    Task<Place?> GetByIdAsync(long id, CancellationToken ct = default);
    void Update(Place place);
}
