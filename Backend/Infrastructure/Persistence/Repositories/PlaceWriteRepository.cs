using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class PlaceWriteRepository : IPlaceWriteRepository
{
    private readonly TravelReviewDbContext _dbContext;

    public PlaceWriteRepository(TravelReviewDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Place?> GetByIdAsync(long id, CancellationToken ct = default)
    {
        return await _dbContext.Places
            .FirstOrDefaultAsync(p => p.Id == id && p.Status != PlaceStatus.Hidden, ct);
    }

    public void Update(Place place)
    {
        _dbContext.Places.Update(place);
    }
}
