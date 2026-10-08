using API.DTOs;
using API.Extensions;
using Application.DTOs;
using Application.Features.Places.Queries;
using FastEndpoints;
using MediatR;

namespace API.Endpoints.Places;

public class GetRelatedPlacesRequest
{
    [BindFrom("id")]
    public long Id { get; set; }

    [QueryParam]
    public int Limit { get; set; } = 6;
}

public class GetRelatedPlacesEndpoint : Endpoint<GetRelatedPlacesRequest, ApiSuccessResponse<IReadOnlyList<PlaceSummaryDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/places/{id}/related");
        AllowAnonymous();
        Options(x => x.RequireRateLimiting("general_api"));
        Summary(s =>
        {
            s.Summary = "Lấy danh sách địa điểm liên quan";
            s.Description = "Lấy danh sách địa điểm liên quan/tương tự dựa trên thuật toán Scored Waterfall kết hợp Danh mục, Vùng miền, khoảng cách tọa độ GPS và chất lượng đánh giá.";
        });
    }

    public override async Task HandleAsync(GetRelatedPlacesRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetRelatedPlacesQuery(req.Id, req.Limit), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
