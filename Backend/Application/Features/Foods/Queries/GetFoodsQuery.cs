using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Foods.Queries;

public record GetFoodsQuery(
    string? Region = null,
    string? Category = null,
    string? Keyword = null,
    decimal? MinPrice = null,
    decimal? MaxPrice = null,
    int Page = 1,
    int PageSize = 10) : IRequest<Result<IReadOnlyList<FoodItemDto>>>;

public class GetFoodsQueryHandler : IRequestHandler<GetFoodsQuery, Result<IReadOnlyList<FoodItemDto>>>
{
    private readonly IFoodRepository _foodRepository;

    public GetFoodsQueryHandler(IFoodRepository foodRepository)
    {
        _foodRepository = foodRepository;
    }

    public async Task<Result<IReadOnlyList<FoodItemDto>>> Handle(GetFoodsQuery request, CancellationToken ct)
    {
        var foods = await _foodRepository.GetFoodsAsync(
            request.Region,
            request.Category,
            request.Keyword,
            request.MinPrice,
            request.MaxPrice,
            request.Page,
            request.PageSize,
            ct);

        return Result<IReadOnlyList<FoodItemDto>>.Success(foods);
    }
}
