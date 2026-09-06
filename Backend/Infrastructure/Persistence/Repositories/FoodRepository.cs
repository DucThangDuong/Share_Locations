using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using Dapper;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class FoodRepository : IFoodRepository
{
    private readonly TravelReviewDbContext _dbContext;

    public FoodRepository(TravelReviewDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    private class RawFoodRow
    {
        public long Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? HistoryInfo { get; set; }
        public string? ImageUrl { get; set; }
        public string? RegionName { get; set; }
        public int? RegionId { get; set; }
    }

    private class RawSuggestedPlace
    {
        public long FoodId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public decimal Rating { get; set; }
        public decimal? MinPrice { get; set; }
        public decimal? MaxPrice { get; set; }
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
                conditions.Add("r.Name LIKE N'%Bắc%'");
            }
            else if (reg.Contains("central") || reg.Contains("trung"))
            {
                conditions.Add("r.Name LIKE N'%Trung%'");
            }
            else if (reg.Contains("south") || reg.Contains("nam"))
            {
                conditions.Add("r.Name LIKE N'%Nam%'");
            }
            else
            {
                conditions.Add("r.Name LIKE @RegionParam");
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
            SELECT DISTINCT
                f.Id,
                f.Name,
                f.Description,
                f.HistoryInfo,
                f.CoverImageUrl AS ImageUrl,
                ISNULL(r.Name, N'Toàn quốc') AS RegionName,
                r.Id AS RegionId
            FROM dbo.Foods f
            LEFT JOIN dbo.FoodProvinces fp ON f.Id = fp.FoodId
            LEFT JOIN dbo.Provinces p ON fp.ProvinceId = p.Id
            LEFT JOIN dbo.Regions r ON p.RegionId = r.Id
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

            string regionCode = "all";
            if (food.RegionName != null)
            {
                if (food.RegionName.Contains("Bắc", StringComparison.OrdinalIgnoreCase)) regionCode = "north";
                else if (food.RegionName.Contains("Trung", StringComparison.OrdinalIgnoreCase)) regionCode = "central";
                else if (food.RegionName.Contains("Nam", StringComparison.OrdinalIgnoreCase)) regionCode = "south";
            }

            var highlights = new List<string>();
            if (!string.IsNullOrWhiteSpace(food.HistoryInfo))
            {
                highlights = food.HistoryInfo
                    .Split(new[] { '\r', '\n', ';' }, StringSplitOptions.RemoveEmptyEntries)
                    .Select(s => s.Trim().TrimStart('-', '*', '•', ' '))
                    .Where(s => !string.IsNullOrWhiteSpace(s))
                    .Take(4)
                    .ToList();
            }

            if (highlights.Count == 0 && !string.IsNullOrWhiteSpace(food.Description))
            {
                highlights.Add(food.Description.Length > 60 ? food.Description[..60] + "..." : food.Description);
            }

            string priceRange = itemMin > 0 && itemMax > 0
                ? $"{itemMin:N0}đ - {itemMax:N0}đ"
                : (itemMin > 0 ? $"Từ {itemMin:N0}đ" : "30.000đ - 100.000đ");

            result.Add(new FoodItemDto
            {
                Id = food.Id,
                Name = food.Name,
                Region = regionCode,
                RegionName = food.RegionName ?? "Toàn quốc",
                Category = string.IsNullOrWhiteSpace(category) ? "Đặc sản vùng miền" : category,
                PriceRange = priceRange,
                MinPrice = itemMin > 0 ? itemMin : null,
                MaxPrice = itemMax > 0 ? itemMax : null,
                ImageUrl = food.ImageUrl,
                Description = food.Description,
                Highlights = highlights,
                SuggestedPlaces = places.Select(p => new FoodSuggestedPlaceDto
                {
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
