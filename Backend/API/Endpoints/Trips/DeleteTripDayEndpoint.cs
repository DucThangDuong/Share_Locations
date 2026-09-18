using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.Features.Trips.Commands;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Trips;

public class DeleteTripDayRequest
{
    public long Id { get; set; }
    public int DayNumber { get; set; }
}

public class DeleteTripDayEndpoint : Endpoint<DeleteTripDayRequest, ApiSuccessResponse<object>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Delete("/api/trips/{id}/days/{dayNumber}");
        Tags("Trips");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Options(x => x.RequireRateLimiting("write_api"));
        Summary(s =>
        {
            s.Summary = "Xóa một ngày khỏi chuyến đi";
            s.Description = "Xóa một ngày trong lịch trình chuyến đi và tự động đánh số lại các ngày tiếp theo.";
        });
    }

    public override async Task HandleAsync(DeleteTripDayRequest req, CancellationToken ct)
    {
        var userId = this.GetUserId();
        if (!userId.HasValue)
        {
            await this.SendApiResponseAsync(
                Result.Unauthorized("Bạn cần đăng nhập để thực hiện thao tác này."),
                ct);
            return;
        }

        var result = await Mediator.Send(new DeleteTripDayCommand(req.Id, req.DayNumber, userId.Value), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
