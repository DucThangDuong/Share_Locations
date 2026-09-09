using API.DTOs;
using API.DTOs.Places;
using API.Extensions;
using Application.DTOs;
using Application.Features.Places.Queries;
using FastEndpoints;
using MediatR;

namespace API.Endpoints.Places;

public class GetPlacesMapEndpoint : Endpoint<GetPlacesMapRequest, ApiSuccessResponse<IReadOnlyList<PlaceMapItemDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/v1/places/map", "/api/places/map");
        AllowAnonymous();
        Options(x => x.RequireRateLimiting("general_api"));
        Summary(s =>
        {
            s.Summary = "Lấy danh sách địa điểm hiển thị trên bản đồ";
            s.Description = "Lấy danh sách các địa điểm có tọa độ vị trí (kinh độ/vĩ độ) trong phạm vi màn hình bản đồ (bounding box) hoặc theo các tiêu chí lọc.";
        });
    }

    public override async Task HandleAsync(GetPlacesMapRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(
            new GetPlacesMapQuery(
                req.Keyword,
                req.Region,
                req.ProvinceId,
                req.CategoryId,
                req.MinLng,
                req.MinLat,
                req.MaxLng,
                req.MaxLat),
            ct);

        await this.SendApiResponseAsync(result, ct);
    }
}
