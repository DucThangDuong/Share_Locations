using API.DTOs;
using API.DTOs.Foods;
using API.Extensions;
using Application.DTOs;
using Application.Features.Foods.Queries;
using FastEndpoints;
using MediatR;

namespace API.Endpoints.Foods;

public class GetFoodsEndpoint : Endpoint<GetFoodsRequest, ApiSuccessResponse<IReadOnlyList<FoodItemDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/v1/foods", "/api/foods");
        AllowAnonymous();
        Options(x => x.RequireRateLimiting("general_api"));
        Summary(s =>
        {
            s.Summary = "Lấy danh sách món ăn đặc sản";
            s.Description = "Tìm kiếm và lọc danh sách các món ăn đặc sản vùng miền theo khu vực, danh mục, từ khóa, khoảng giá và phân trang.";
        });
    }

    public override async Task HandleAsync(GetFoodsRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(
            new GetFoodsQuery(
                req.Region,
                req.Category,
                req.Keyword,
                req.MinPrice,
                req.MaxPrice,
                req.Page,
                req.PageSize),
            ct);

        await this.SendApiResponseAsync(result, ct);
    }
}
