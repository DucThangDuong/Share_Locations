using API.DTOs;
using API.Extensions;
using Application.Common.Interfaces;
using Application.DTOs;
using FastEndpoints;

namespace API.Endpoints.Recommendations;

public class GetSimilarPlacesRequest
{
    public long PlaceId { get; set; }

    [QueryParam]
    public int TopK { get; set; } = 6;

    [QueryParam]
    public double? RadiusKm { get; set; }
}

public class GetSimilarPlacesEndpoint : Endpoint<GetSimilarPlacesRequest, ApiSuccessResponse<IReadOnlyList<RecommendedPlaceDto>>>
{
    public IRecommendationService RecommendationService { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/recommendations/places/{PlaceId:long}/similar");
        AllowAnonymous();
        Options(x => x.RequireRateLimiting("general_api"));
        Summary(s =>
        {
            s.Summary = "Gợi ý địa điểm tương tự (Item-to-Item KNN)";
            s.Description = "Gợi ý danh sách các địa điểm có đặc trưng tương đồng với địa điểm hiện tại (Item-to-Item KNN) kết hợp bộ lọc bán kính km theo tọa độ.";
        });
    }

    public override async Task HandleAsync(GetSimilarPlacesRequest req, CancellationToken ct)
    {
        int safeTopK = Math.Clamp(req.TopK, 1, 30);
        var items = await RecommendationService.GetSimilarPlacesAsync(req.PlaceId, safeTopK, req.RadiusKm, ct);

        await this.SendApiResponseAsync(
            Application.Common.Result<IReadOnlyList<RecommendedPlaceDto>>.Success(items, "Lấy danh sách địa điểm tương tự thành công"), ct);
    }
}
