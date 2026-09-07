using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using Dapper;
using Infrastructure.Persistence;
using Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class FoodRepository : IFoodRepository
{
    private readonly TravelReviewDbContext _dbContext;

    public FoodRepository(TravelReviewDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<FoodItemDto>> GetFoodsAsync(
        string? region,
        string? category,
        string? keyword,
        decimal? minPrice,
        decimal? maxPrice,
        int page,
        int pageSize,
        CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        var conditions = new List<string> { "f.Status = 1" };
        var parameters = new DynamicParameters();

        if (!string.IsNullOrWhiteSpace(region))
        {
            var reg = region.Trim().ToLowerInvariant();
            if (reg.Contains("north") || reg.Contains("bac") || reg.Contains("bắc"))
            {
                conditions.Add(@"EXISTS (
                    SELECT 1 FROM dbo.FoodProvinces fp
                    JOIN dbo.Provinces p ON fp.ProvinceId = p.Id
                    JOIN dbo.Regions r ON p.RegionId = r.Id
                    WHERE fp.FoodId = f.Id AND r.Name LIKE N'%Bắc%'
                )");
            }
            else if (reg.Contains("central") || reg.Contains("trung"))
            {
                conditions.Add(@"EXISTS (
                    SELECT 1 FROM dbo.FoodProvinces fp
                    JOIN dbo.Provinces p ON fp.ProvinceId = p.Id
                    JOIN dbo.Regions r ON p.RegionId = r.Id
                    WHERE fp.FoodId = f.Id AND r.Name LIKE N'%Trung%'
                )");
            }
            else if (reg.Contains("south") || reg.Contains("nam"))
            {
                conditions.Add(@"EXISTS (
                    SELECT 1 FROM dbo.FoodProvinces fp
                    JOIN dbo.Provinces p ON fp.ProvinceId = p.Id
                    JOIN dbo.Regions r ON p.RegionId = r.Id
                    WHERE fp.FoodId = f.Id AND r.Name LIKE N'%Nam%'
                )");
            }
            else
            {
                conditions.Add(@"EXISTS (
                    SELECT 1 FROM dbo.FoodProvinces fp
                    JOIN dbo.Provinces p ON fp.ProvinceId = p.Id
                    JOIN dbo.Regions r ON p.RegionId = r.Id
                    WHERE fp.FoodId = f.Id AND r.Name LIKE @RegionParam
                )");
                parameters.Add("RegionParam", $"%{region.Trim()}%");
            }
        }

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            conditions.Add("(f.Name LIKE @Keyword OR f.Description LIKE @Keyword)");
            parameters.Add("Keyword", $"%{keyword.Trim()}%");
        }

        var whereClause = string.Join(" AND ", conditions);
        var offset = Math.Max(0, (page - 1) * pageSize);
        parameters.Add("Offset", offset);
        parameters.Add("PageSize", Math.Max(1, pageSize));

        var sql = $@"
            SELECT
                f.Id,
                f.Name,
                f.Description,
                f.CoverImageUrl AS ImageUrl
            FROM dbo.Foods f
            WHERE {whereClause}
            ORDER BY f.Id
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;";

        var foodRows = (await connection.QueryAsync<RawFoodRow>(sql, parameters)).ToList();

        if (foodRows.Count == 0)
        {
            return Array.Empty<FoodItemDto>();
        }

        var foodIds = foodRows.Select(x => x.Id).Distinct().ToList();

        const string placesSql = @"
            SELECT 
                fp.FoodId,
                p.Id AS PlaceId,
                p.Name,
                p.Address,
                p.AvgRating AS Rating,
                p.MinPrice,
                p.MaxPrice
            FROM dbo.FoodPlaces fp
            INNER JOIN dbo.Places p ON fp.PlaceId = p.Id
            WHERE fp.FoodId IN @FoodIds AND p.Status = 1;";

        var suggestedPlaces = (await connection.QueryAsync<RawSuggestedPlace>(placesSql, new { FoodIds = foodIds })).ToList();
        var placesByFood = suggestedPlaces.ToLookup(p => p.FoodId);

        var result = new List<FoodItemDto>();

        foreach (var food in foodRows)
        {
            var places = placesByFood[food.Id].ToList();
            var itemMin = places.Where(p => p.MinPrice.HasValue).Select(p => p.MinPrice!.Value).DefaultIfEmpty(0).Min();
            var itemMax = places.Where(p => p.MaxPrice.HasValue).Select(p => p.MaxPrice!.Value).DefaultIfEmpty(0).Max();

            if (minPrice.HasValue && itemMax > 0 && itemMax < minPrice.Value) continue;
            if (maxPrice.HasValue && itemMin > 0 && itemMin > maxPrice.Value) continue;

            string priceRange = itemMin > 0 && itemMax > 0
                ? $"{itemMin:N0}đ - {itemMax:N0}đ"
                : (itemMin > 0 ? $"Từ {itemMin:N0}đ" : "30.000đ - 100.000đ");

            result.Add(new FoodItemDto
            {
                Id = food.Id,
                Name = food.Name,
                PriceRange = priceRange,
                MinPrice = itemMin > 0 ? itemMin : null,
                MaxPrice = itemMax > 0 ? itemMax : null,
                ImageUrl = food.ImageUrl,
                Description = food.Description,
                SuggestedPlaces = places.Select(p => new FoodSuggestedPlaceDto
                {
                    PlaceId = p.PlaceId,
                    Name = p.Name,
                    Address = p.Address,
                    Rating = p.Rating,
                    Price = p.MinPrice.HasValue ? $"{p.MinPrice.Value:N0}đ" : "Theo thời giá"
                }).ToList()
            });
        }

        return result;
    }
}
