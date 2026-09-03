using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using Dapper;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class ProvinceRepository : IProvinceRepository
{
    private readonly TravelReviewDbContext _dbContext;

    public ProvinceRepository(TravelReviewDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<ProvinceDto>> GetAllAsync(CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        const string sql = @"
            SELECT p.Id, p.RegionId, r.Name AS RegionName, p.Name, p.Tagline, p.Description, 
                   p.ImageUrl, p.Featured, p.DisplayOrder,
                   COALESCE(counts.PlaceCount, 0) AS PlaceCount
            FROM dbo.Provinces p
            INNER JOIN dbo.Regions r ON p.RegionId = r.Id
            LEFT JOIN (
                SELECT pl.ProvinceId, COUNT(1) AS PlaceCount
                FROM dbo.Places pl
                WHERE pl.Status = 1
                GROUP BY pl.ProvinceId
            ) counts ON counts.ProvinceId = p.Id
            WHERE p.Status = 1
            ORDER BY p.DisplayOrder, p.Name;";

        var provinces = await connection.QueryAsync<ProvinceDto>(sql);
        return provinces.ToList();
    }
}
