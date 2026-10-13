using API.DTOs;
using API.Extensions;
using Application.DTOs;
using Application.Features.Places.Queries;
using FastEndpoints;
using MediatR;

namespace API.Endpoints.Places;

public class GetRecommendedPlacesRequest
{
    [QueryParam]
    public long? UserId { get; set; }

    [QueryParam]
    public int Limit { get; set; } = 5;
}

public class GetRecommendedPlacesEndpoint : Endpoint<GetRecommendedPlacesRequest, ApiSuccessResponse<IReadOnlyList<PlaceRecommendationDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/places/recommendations", "/api/places/recommendations/{UserId}");
        AllowAnonymous();
        Options(x => x.RequireRateLimiting("general_api"));
        Summary(s =>
        {
            s.Summary = "Gợi ý địa điểm du lịch cá nhân hóa bằng thuật toán KNN";
            s.Description = "Gợi ý danh sách địa điểm phù hợp cho người dùng dựa trên lịch sử đánh giá (KNN Cosine Similarity) hoặc gợi ý địa điểm hàng đầu nếu là người dùng mới (Cold Start).";
        });
    }

    public override async Task HandleAsync(GetRecommendedPlacesRequest req, CancellationToken ct)
    {
        var effectiveUserId = this.GetUserId() ?? (req.UserId > 0 ? req.UserId : null);
        var limit = req.Limit is > 0 and <= 50 ? req.Limit : 5;

        var result = await Mediator.Send(new GetRecommendedPlacesQuery(effectiveUserId, limit), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
