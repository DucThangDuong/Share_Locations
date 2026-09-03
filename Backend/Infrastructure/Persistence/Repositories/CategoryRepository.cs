using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using Dapper;
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
        var connection = _dbContext.Database.GetDbConnection();

        const string sql = @"
            SELECT c.Id, c.PlaceTypeId, pt.Name AS PlaceTypeName, c.Name, c.IconClass,
                   COALESCE(counts.PlaceCount, 0) AS PlaceCount
            FROM dbo.Categories c
            INNER JOIN dbo.PlaceTypes pt ON c.PlaceTypeId = pt.Id
            LEFT JOIN (
                SELECT pl.CategoryId, COUNT(1) AS PlaceCount
                FROM dbo.Places pl
                WHERE pl.Status = 2
                GROUP BY pl.CategoryId
            ) counts ON counts.CategoryId = c.Id
            WHERE c.Status = 1
            ORDER BY c.Name;";

        var categories = await connection.QueryAsync<CategoryDto>(sql);
        return categories.ToList();
    }
}
