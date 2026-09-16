using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.Features.Friends.Commands;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Friends;

public class RespondFriendRequest
{
    public long TargetUserId { get; set; }
    public string Action { get; set; } = "accept";
}

public class RespondFriendRequestEndpoint : Endpoint<RespondFriendRequest, ApiSuccessResponse<object>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Put("/api/friends/respond/{targetUserId}");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Options(x => x.RequireRateLimiting("write_api"));
        Summary(s =>
        {
            s.Summary = "Phản hồi lời mời kết bạn";
            s.Description = "Chấp nhận (action: 'accept') hoặc từ chối (action: 'reject') lời mời kết bạn.";
        });
    }

    public override async Task HandleAsync(RespondFriendRequest req, CancellationToken ct)
    {
        var userId = this.GetUserId();
        if (!userId.HasValue)
        {
            await this.SendApiResponseAsync(
                Result.Unauthorized("Bạn cần đăng nhập để thực hiện thao tác này."),
                ct);
            return;
        }

        var result = await Mediator.Send(new RespondFriendRequestCommand(userId.Value, req.TargetUserId, req.Action), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
