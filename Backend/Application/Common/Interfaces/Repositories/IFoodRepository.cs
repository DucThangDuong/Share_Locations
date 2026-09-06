using Application.DTOs;

namespace Application.Common.Interfaces.Repositories;

public interface IFoodRepository
{
    Task<IReadOnlyList<FoodItemDto>> GetFoodsAsync(
        string? region,
        string? category,
        string? keyword,
        decimal? minPrice,
        decimal? maxPrice,
        int page,
        int pageSize,
        CancellationToken ct = default);
}
