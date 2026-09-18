using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.Features.Trips.Commands;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Trips;

public class DeleteTripRequest
{
    public long Id { get; set; }
}

public class DeleteTripEndpoint : Endpoint<DeleteTripRequest, ApiSuccessResponse<object>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Delete("/api/trips/{id}");
        Tags("Trips");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Options(x => x.RequireRateLimiting("write_api"));
        Summary(s =>
        {
            s.Summary = "Xóa chuyến đi";
            s.Description = "Chỉ có chủ sở hữu (Owner) mới có quyền xóa chuyến đi.";
        });
    }

    public override async Task HandleAsync(DeleteTripRequest req, CancellationToken ct)
    {
        var userId = this.GetUserId();
        if (!userId.HasValue)
        {
            await this.SendApiResponseAsync(
                Result.Unauthorized("Bạn cần đăng nhập để thực hiện thao tác này."),
                ct);
            return;
        }

        var result = await Mediator.Send(new DeleteTripCommand(req.Id, userId.Value), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
