using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.Features.Friends.Commands;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Friends;

public class SendFriendRequest
{
    public long TargetUserId { get; set; }
}

public class SendFriendRequestEndpoint : Endpoint<SendFriendRequest, ApiSuccessResponse<object>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Post("/api/friends/request/{targetUserId}");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Options(x => x.RequireRateLimiting("auth_strict"));
        Summary(s =>
        {
            s.Summary = "Gửi lời mời kết bạn";
            s.Description = "Gửi lời mời kết bạn tới một người dùng khác. Giới hạn tần suất để chống spam.";
        });
    }

    public override async Task HandleAsync(SendFriendRequest req, CancellationToken ct)
    {
        var userId = this.GetUserId();
        if (!userId.HasValue)
        {
            await this.SendApiResponseAsync(
                Result.Unauthorized("Bạn cần đăng nhập để gửi lời mời kết bạn."),
                ct);
            return;
        }

        var result = await Mediator.Send(new SendFriendRequestCommand(userId.Value, req.TargetUserId), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
