using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.Features.Trips.Commands;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Trips;

public class RemoveTripMemberRequest
{
    public long Id { get; set; }
    public long UserId { get; set; }
}

public class RemoveTripMemberEndpoint : Endpoint<RemoveTripMemberRequest, ApiSuccessResponse<object>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Delete("/api/v1/trips/{id}/members/{userId}");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Options(x => x.RequireRateLimiting("write_api"));
        Summary(s =>
        {
            s.Summary = "Xóa hoặc rút khỏi danh sách thành viên chuyến đi";
            s.Description = "Chủ sở hữu có thể xóa thành viên khỏi chuyến đi, hoặc thành viên có thể tự rút lui khỏi chuyến đi.";
        });
    }

    public override async Task HandleAsync(RemoveTripMemberRequest req, CancellationToken ct)
    {
        var currentUserId = this.GetUserId();
        if (!currentUserId.HasValue)
        {
            await this.SendApiResponseAsync(
                Result.Unauthorized("Bạn cần đăng nhập để thực hiện thao tác này."),
                ct);
            return;
        }

        var result = await Mediator.Send(new RemoveTripMemberCommand(req.Id, req.UserId, currentUserId.Value), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
