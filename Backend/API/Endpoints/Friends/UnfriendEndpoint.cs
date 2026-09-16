using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.Features.Friends.Commands;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Friends;

public class UnfriendRequest
{
    public long TargetUserId { get; set; }
}

public class UnfriendEndpoint : Endpoint<UnfriendRequest, ApiSuccessResponse<object>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Delete("/api/friends/{targetUserId}");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Options(x => x.RequireRateLimiting("write_api"));
        Summary(s =>
        {
            s.Summary = "Hủy kết bạn hoặc hủy lời mời kết bạn";
            s.Description = "Xóa quan hệ bạn bè hoặc hủy lời mời kết bạn đã gửi.";
        });
    }

    public override async Task HandleAsync(UnfriendRequest req, CancellationToken ct)
    {
        var userId = this.GetUserId();
        if (!userId.HasValue)
        {
            await this.SendApiResponseAsync(
                Result.Unauthorized("Bạn cần đăng nhập để thực hiện thao tác này."),
                ct);
            return;
        }

        var result = await Mediator.Send(new UnfriendCommand(userId.Value, req.TargetUserId), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
