using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using Domain.Enums;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class CategoryRepository : ICategoryRepository
{
    private readonly TravelReviewDbContext _dbContext;

    public CategoryRepository(TravelReviewDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<CategoryDto>> GetAllAsync(CancellationToken ct = default)
    {
        return await _dbContext.Categories
            .AsNoTracking()
            .Where(c => c.Status == RecordStatus.Active)
            .OrderBy(c => c.DisplayOrder)
            .ThenBy(c => c.Name)
            .Select(c => new CategoryDto
            {
                Id = c.Id,
                PlaceTypeId = c.PlaceTypeId,
                Name = c.Name,
                Slug = c.Slug,
                IconUrl = c.IconUrl,
                ImageUrl = c.ImageUrl,
                DisplayOrder = c.DisplayOrder
            })
            .ToListAsync(ct);
    }
}

