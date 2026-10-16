using API.DTOs;
using API.Extensions;
using Application.Common.Interfaces;
using Application.DTOs;
using FastEndpoints;

namespace API.Endpoints.Recommendations;

public class GetTripPlaceSuggestionsRequest
{
    public long TripId { get; set; }

    [QueryParam]
    public int? ProvinceId { get; set; }

    [QueryParam]
    public int TopK { get; set; } = 10;
}

public class GetTripPlaceSuggestionsEndpoint : Endpoint<GetTripPlaceSuggestionsRequest, ApiSuccessResponse<IReadOnlyList<RecommendedPlaceDto>>>
{
    public IRecommendationService RecommendationService { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/recommendations/trips/{TripId:long}/suggested-places");
        AllowAnonymous();
        Options(x => x.RequireRateLimiting("general_api"));
        Summary(s =>
        {
            s.Summary = "Gợi ý địa điểm cho lịch trình chuyến đi (Trip Planner KNN)";
            s.Description = "Gợi ý các địa điểm phù hợp với gu chung của nhóm thành viên trong chuyến đi, tập trung vào tỉnh của chuyến đi và loại trừ các địa điểm đã có trong lịch trình.";
        });
    }

    public override async Task HandleAsync(GetTripPlaceSuggestionsRequest req, CancellationToken ct)
    {
        int safeTopK = Math.Clamp(req.TopK, 1, 50);
        var items = await RecommendationService.GetTripPlaceSuggestionsAsync(req.TripId, req.ProvinceId, safeTopK, ct);

        await this.SendApiResponseAsync(
            Application.Common.Result<IReadOnlyList<RecommendedPlaceDto>>.Success(items, "Lấy gợi ý địa điểm cho chuyến đi thành công"), ct);
    }
}
