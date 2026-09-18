using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Trips.Commands;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Trips;

public class AddTripPlaceRequest
{
    public long Id { get; set; }
    public int DayNumber { get; set; }
    public long PlaceId { get; set; }
    public int VisitOrder { get; set; }
    public string? StartTime { get; set; }
    public string? EndTime { get; set; }
    public decimal? EstimatedCost { get; set; }
    public string? TransportMode { get; set; }
    public string? Note { get; set; }
}

public class AddTripPlaceEndpoint : Endpoint<AddTripPlaceRequest, ApiSuccessResponse<TripPlaceDetailDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Post("/api/trips/{id}/days/{dayNumber}/places");
        Tags("Trips");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Options(x => x.RequireRateLimiting("write_api"));
        Summary(s =>
        {
            s.Summary = "Thêm điểm dừng vào ngày trong chuyến đi";
            s.Description = "Thêm một địa điểm vào ngày cụ thể của lịch trình chuyến đi.";
        });
    }

    public override async Task HandleAsync(AddTripPlaceRequest req, CancellationToken ct)
    {
        var userId = this.GetUserId();
        if (!userId.HasValue)
        {
            await this.SendApiResponseAsync(
                Result<TripPlaceDetailDto>.Unauthorized("Bạn cần đăng nhập để thực hiện thao tác này."),
                ct);
            return;
        }

        var dto = new AddTripPlaceRequestDto
        {
            PlaceId = req.PlaceId,
            VisitOrder = req.VisitOrder,
            StartTime = req.StartTime,
            EndTime = req.EndTime,
            EstimatedCost = req.EstimatedCost,
            TransportMode = req.TransportMode,
            Note = req.Note
        };

        var result = await Mediator.Send(new AddTripPlaceCommand(req.Id, req.DayNumber, userId.Value, dto), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
