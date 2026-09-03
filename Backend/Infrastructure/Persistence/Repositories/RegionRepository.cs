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

    private class ProvinceWithRegionRaw : ProvinceSummaryDto
    {
        public int RegionId { get; set; }
    }

    public async Task<IReadOnlyList<RegionDto>> GetAllAsync(CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        const string sql = @"
            SELECT r.Id, r.Name, r.Tagline, r.Description, r.ImageUrl, r.OrderIndex,
                   (SELECT COUNT(1) FROM dbo.Provinces p WHERE p.RegionId = r.Id AND p.Status = 1) AS ProvinceCount
            FROM dbo.Regions r
            WHERE r.Status = 1
            ORDER BY r.OrderIndex;

            SELECT p.Id, p.RegionId, p.Name, p.ImageUrl, p.Featured,
                   (SELECT COUNT(1) FROM dbo.Places pl WHERE pl.ProvinceId = p.Id AND pl.Status = 1) AS PlaceCount
            FROM dbo.Provinces p
            WHERE p.Status = 1
            ORDER BY p.DisplayOrder, p.Name;";

        using var multi = await connection.QueryMultipleAsync(sql);
        var regions = (await multi.ReadAsync<RegionDto>()).ToList();
        var provinces = (await multi.ReadAsync<ProvinceWithRegionRaw>()).ToList();

        var provincesByRegion = provinces.ToLookup(p => p.RegionId);

        foreach (var region in regions)
        {
            region.Provinces = provincesByRegion[region.Id].Select(p => (ProvinceSummaryDto)p).ToList();
        }

        return regions;
    }
}
