using API.DTOs;
using API.Extensions;
using Application.Common.Interfaces;
using Application.DTOs;
using FastEndpoints;

namespace API.Endpoints.Recommendations;

public class GetRecommendedFoodsRequest
{
    [QueryParam]
    public int TopK { get; set; } = 8;
}

public class GetRecommendedFoodsEndpoint : Endpoint<GetRecommendedFoodsRequest, ApiSuccessResponse<IReadOnlyList<RecommendedFoodDto>>>
{
    public IRecommendationService RecommendationService { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/recommendations/foods/for-you");
        AllowAnonymous();
        Options(x => x.RequireRateLimiting("general_api"));
        Summary(s =>
        {
            s.Summary = "Gợi ý món ăn đặc sản theo gu địa điểm của người dùng";
            s.Description = "Truy vấn các món ăn đặc sản gắn liền với các địa điểm lọt vào Top-K KNN của người dùng.";
        });
    }

    public override async Task HandleAsync(GetRecommendedFoodsRequest req, CancellationToken ct)
    {
        long? userId = this.GetUserId();
        int safeTopK = Math.Clamp(req.TopK, 1, 30);

        var foods = await RecommendationService.GetRecommendedFoodsForUserAsync(userId, safeTopK, ct);

        await this.SendApiResponseAsync(
            Application.Common.Result<IReadOnlyList<RecommendedFoodDto>>.Success(foods, "Lấy gợi ý đặc sản ẩm thực thành công"), ct);
    }
}
