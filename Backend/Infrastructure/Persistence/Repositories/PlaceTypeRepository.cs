using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using Dapper;
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
        var connection = _dbContext.Database.GetDbConnection();

        const string sql = @"
            SELECT pt.Id, pt.Name, pt.IconClass
            FROM dbo.PlaceTypes pt
            WHERE pt.Status = 1
            ORDER BY pt.Id;";

        var placeTypes = await connection.QueryAsync<PlaceTypeDto>(sql);
        return placeTypes.ToList();
    }
}
