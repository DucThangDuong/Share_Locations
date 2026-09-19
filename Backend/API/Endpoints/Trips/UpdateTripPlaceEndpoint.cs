using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Trips.Commands;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Trips;

public class UpdateTripPlaceRequest
{
    public long TripPlaceId { get; set; }
    public int VisitOrder { get; set; }
    public string? StartTime { get; set; }
    public string? EndTime { get; set; }
    public decimal? EstimatedCost { get; set; }
    public string? TransportMode { get; set; }
    public string? Note { get; set; }
}

public class UpdateTripPlaceEndpoint : Endpoint<UpdateTripPlaceRequest, ApiSuccessResponse<object>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Put("/api/trips/places/{tripPlaceId}");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Options(x => x.RequireRateLimiting("write_api"));
        Summary(s =>
        {
            s.Summary = "Cập nhật thông tin điểm dừng";
            s.Description = "Cập nhật thứ tự tham quan, thời gian, chi phí và ghi chú cho điểm dừng.";
        });
    }

    public override async Task HandleAsync(UpdateTripPlaceRequest req, CancellationToken ct)
    {
        var userId = this.GetUserId();
        if (!userId.HasValue)
        {
            await this.SendApiResponseAsync(
                Result.Unauthorized("Bạn cần đăng nhập để thực hiện thao tác này."),
                ct);
            return;
        }

        var dto = new UpdateTripPlaceRequestDto
        {
            VisitOrder = req.VisitOrder,
            StartTime = req.StartTime,
            EndTime = req.EndTime,
            EstimatedCost = req.EstimatedCost,
            TransportMode = req.TransportMode,
            Note = req.Note
        };

        var result = await Mediator.Send(new UpdateTripPlaceCommand(req.TripPlaceId, userId.Value, dto), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
