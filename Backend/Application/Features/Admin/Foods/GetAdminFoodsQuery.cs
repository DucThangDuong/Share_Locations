using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs.Admin;
using MediatR;

namespace Application.Features.Admin.Foods;

public record GetAdminFoodsQuery(
    int? ProvinceId = null,
    string? Status = null,
    string? Keyword = null,
    int Page = 1,
    int PageSize = 10) : IRequest<Result<PagedResult<AdminFoodItemDto>>>;

public class GetAdminFoodsQueryHandler : IRequestHandler<GetAdminFoodsQuery, Result<PagedResult<AdminFoodItemDto>>>
{
    private readonly IAdminFoodRepository _foodRepository;

    public GetAdminFoodsQueryHandler(IAdminFoodRepository foodRepository)
    {
        _foodRepository = foodRepository;
    }

    public async Task<Result<PagedResult<AdminFoodItemDto>>> Handle(GetAdminFoodsQuery request, CancellationToken ct)
    {
        var page = request.Page > 0 ? request.Page : 1;
        var pageSize = request.PageSize > 0 ? request.PageSize : 10;

        var result = await _foodRepository.GetAdminFoodsAsync(
            request.ProvinceId,
            request.Status,
            request.Keyword,
            page,
            pageSize,
            ct);

        return Result<PagedResult<AdminFoodItemDto>>.Success(result);
    }
}
