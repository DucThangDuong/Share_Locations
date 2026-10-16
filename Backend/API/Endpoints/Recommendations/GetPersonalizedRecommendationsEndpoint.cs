using API.DTOs;
using API.Extensions;
using Application.Common.Interfaces;
using Application.DTOs;
using FastEndpoints;

namespace API.Endpoints.Recommendations;

public class GetPersonalizedRecommendationsRequest
{
    [QueryParam]
    public int TopK { get; set; } = 10;

    [QueryParam]
    public int? ProvinceId { get; set; }

    [QueryParam]
    public int? CategoryId { get; set; }
}

public class GetPersonalizedRecommendationsEndpoint : Endpoint<GetPersonalizedRecommendationsRequest, ApiSuccessResponse<PersonalizedPlacesResponse>>
{
    public IRecommendationService RecommendationService { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/recommendations/places/for-you");
        AllowAnonymous();
        Options(x => x.RequireRateLimiting("general_api"));
        Summary(s =>
        {
            s.Summary = "Gợi ý địa điểm cá nhân hóa (Personalized Feed KNN)";
            s.Description = "Gợi ý danh sách địa điểm theo tâm sở thích của người dùng (KNN Cosine Similarity) kết hợp Cold-start khi chưa có dữ liệu tương tác.";
        });
    }

    public override async Task HandleAsync(GetPersonalizedRecommendationsRequest req, CancellationToken ct)
    {
        long? userId = this.GetUserId();
        int safeTopK = Math.Clamp(req.TopK, 1, 50);

        var items = await RecommendationService.GetRecommendationsForUserAsync(
            userId, safeTopK, req.ProvinceId, req.CategoryId, ct);

        var response = new PersonalizedPlacesResponse
        {
            UserId = userId,
            IsPersonalized = items.Count > 0 && !items[0].IsColdStartFallback,
            Count = items.Count,
            Items = items
        };

        await this.SendApiResponseAsync(
            Application.Common.Result<PersonalizedPlacesResponse>.Success(response, "Lấy gợi ý địa điểm thành công"), ct);
    }
}
