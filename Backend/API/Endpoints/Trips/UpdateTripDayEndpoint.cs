using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Trips.Commands;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Trips;

public class UpdateTripDayRequest
{
    public long Id { get; set; }
    public int DayNumber { get; set; }
    public string? DayTitle { get; set; }
    public DateOnly? Date { get; set; }
}

public class UpdateTripDayEndpoint : Endpoint<UpdateTripDayRequest, ApiSuccessResponse<TripDayDetailDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Put("/api/trips/{id}/days/{dayNumber}");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Options(x => x.RequireRateLimiting("write_api"));
        Summary(s =>
        {
            s.Summary = "Cập nhật thông tin ngày trong chuyến đi";
            s.Description = "Cập nhật tiêu đề hoặc ngày cụ thể cho một ngày trong lịch trình chuyến đi.";
        });
    }

    public override async Task HandleAsync(UpdateTripDayRequest req, CancellationToken ct)
    {
        var userId = this.GetUserId();
        if (!userId.HasValue)
        {
            await this.SendApiResponseAsync(
                Result<TripDayDetailDto>.Unauthorized("Bạn cần đăng nhập để thực hiện thao tác này."),
                ct);
            return;
        }

        var dto = new UpdateTripDayRequestDto
        {
            DayTitle = req.DayTitle,
            Date = req.Date
        };

        var result = await Mediator.Send(new UpdateTripDayCommand(req.Id, req.DayNumber, userId.Value, dto), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
