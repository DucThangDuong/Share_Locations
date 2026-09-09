using API.DTOs;
using API.Extensions;
using Application.DTOs;
using Application.Features.Places.Queries;
using FastEndpoints;
using MediatR;

namespace API.Endpoints.Places;

public class GetPlaceDetailRequest
{
    [BindFrom("id")]
    public long Id { get; set; }
}

public class GetPlaceDetailEndpoint : Endpoint<GetPlaceDetailRequest, ApiSuccessResponse<PlaceDetailDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/v1/places/{id}", "/api/places/{id}");
        AllowAnonymous();
        Options(x => x.RequireRateLimiting("general_api"));
        Summary(s =>
        {
            s.Summary = "Lấy thông tin chi tiết địa điểm";
            s.Description = "Lấy đầy đủ thông tin chi tiết địa điểm bao gồm mô tả, địa chỉ, ảnh đại diện, danh sách ảnh (ảnh địa điểm và ảnh từ đánh giá), tiện ích và đánh giá sao.";
        });
    }

    public override async Task HandleAsync(GetPlaceDetailRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetPlaceDetailQuery(req.Id), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
