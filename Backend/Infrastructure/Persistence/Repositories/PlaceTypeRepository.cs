using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using Domain.Enums;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class PlaceTypeRepository : IPlaceTypeRepository
{
    private readonly TravelReviewDbContext _dbContext;

    public PlaceTypeRepository(TravelReviewDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<PlaceTypeDto>> GetAllAsync(CancellationToken ct = default)
    {
        return await _dbContext.PlaceTypes
            .AsNoTracking()
            .Where(pt => pt.Status == RecordStatus.Active)
            .OrderBy(pt => pt.Id)
            .Select(pt => new PlaceTypeDto
            {
                Id = pt.Id,
                Name = pt.Name,
                ImageUrl = pt.ImageUrl
            })
            .ToListAsync(ct);
    }
}
