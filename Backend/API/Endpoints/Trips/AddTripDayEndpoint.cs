using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Trips.Commands;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Trips;

public class AddTripDayRequest
{
    public long Id { get; set; }
    public string? DayTitle { get; set; }
    public DateOnly? Date { get; set; }
}

public class AddTripDayEndpoint : Endpoint<AddTripDayRequest, ApiSuccessResponse<TripDayDetailDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Post("/api/trips/{id}/days");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Options(x => x.RequireRateLimiting("write_api"));
        Summary(s =>
        {
            s.Summary = "Thêm ngày mới vào chuyến đi";
            s.Description = "Thêm một ngày tiếp theo vào lịch trình chuyến đi.";
        });
    }

    public override async Task HandleAsync(AddTripDayRequest req, CancellationToken ct)
    {
        var userId = this.GetUserId();
        if (!userId.HasValue)
        {
            await this.SendApiResponseAsync(
                Result<TripDayDetailDto>.Unauthorized("Bạn cần đăng nhập để thực hiện thao tác này."),
                ct);
            return;
        }

        var dto = new AddTripDayRequestDto
        {
            DayTitle = req.DayTitle,
            Date = req.Date
        };

        var result = await Mediator.Send(new AddTripDayCommand(req.Id, userId.Value, dto), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
