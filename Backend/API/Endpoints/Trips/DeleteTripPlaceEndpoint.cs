using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.Features.Trips.Commands;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Trips;

public class DeleteTripPlaceRequest
{
    public long TripPlaceId { get; set; }
}

public class DeleteTripPlaceEndpoint : Endpoint<DeleteTripPlaceRequest, ApiSuccessResponse<object>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Delete("/api/trips/places/{tripPlaceId}");
        Tags("Trips");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Options(x => x.RequireRateLimiting("write_api"));
        Summary(s =>
        {
            s.Summary = "Xóa điểm dừng khỏi chuyến đi";
            s.Description = "Xóa điểm dừng khỏi ngày và tự động sắp xếp lại thứ tự các điểm dừng còn lại.";
        });
    }

    public override async Task HandleAsync(DeleteTripPlaceRequest req, CancellationToken ct)
    {
        var userId = this.GetUserId();
        if (!userId.HasValue)
        {
            await this.SendApiResponseAsync(
                Result.Unauthorized("Bạn cần đăng nhập để thực hiện thao tác này."),
                ct);
            return;
        }

        var result = await Mediator.Send(new DeleteTripPlaceCommand(req.TripPlaceId, userId.Value), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
