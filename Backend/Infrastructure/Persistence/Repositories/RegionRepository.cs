using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using Dapper;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class RegionRepository : IRegionRepository
{
    private readonly TravelReviewDbContext _dbContext;

    public RegionRepository(TravelReviewDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<RegionDto>> GetAllAsync(CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        const string sql = @"
            SELECT r.Id, r.Name, r.Tagline, r.Description, r.ImageUrl, r.OrderIndex,
                   (SELECT COUNT(1) FROM dbo.Provinces p WHERE p.RegionId = r.Id AND p.Status = 1) AS ProvinceCount
            FROM dbo.Regions r
            WHERE r.Status = 1
            ORDER BY r.OrderIndex;";

        var regions = await connection.QueryAsync<RegionDto>(sql);
        return regions.ToList();
    }
}
