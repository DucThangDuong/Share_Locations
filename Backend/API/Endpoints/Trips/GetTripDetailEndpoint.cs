using API.DTOs;
using API.Extensions;
using Application.DTOs;
using Application.Features.Trips.Queries;
using FastEndpoints;
using MediatR;

namespace API.Endpoints.Trips;

public class GetTripDetailRequest
{
    public long Id { get; set; }
}

public class GetTripDetailEndpoint : Endpoint<GetTripDetailRequest, ApiSuccessResponse<TripDetailDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/v1/trips/{id}");
        AllowAnonymous();
        Options(x => x.RequireRateLimiting("general_api"));
        Summary(s =>
        {
            s.Summary = "Lấy chi tiết lịch trình chuyến đi";
            s.Description = "Lấy đầy đủ thông tin chuyến đi bao gồm các ngày, điểm dừng và danh sách thành viên. Tự động kiểm tra quyền đối với chuyến đi riêng tư.";
        });
    }

    public override async Task HandleAsync(GetTripDetailRequest req, CancellationToken ct)
    {
        var userId = this.GetUserId();
        var result = await Mediator.Send(new GetTripDetailQuery(req.Id, userId), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
