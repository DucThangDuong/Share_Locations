using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.Features.Chat.Commands;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Chat;

public class LeaveGroupRoomRequest
{
    public long RoomId { get; set; }
}

public class LeaveGroupRoomEndpoint : Endpoint<LeaveGroupRoomRequest, ApiSuccessResponse<object>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Post("/api/chat/rooms/{roomId}/leave");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Rời khỏi nhóm chat";
            s.Description = "Thành viên rời nhóm bình thường. Nếu là quản trị viên rời nhóm, toàn bộ thành viên sẽ bị xóa và nhóm sẽ được giải tán.";
        });
    }

    public override async Task HandleAsync(LeaveGroupRoomRequest req, CancellationToken ct)
    {
        var userId = this.GetUserId();
        if (!userId.HasValue)
        {
            await this.SendApiResponseAsync(Result.Unauthorized("Bạn cần đăng nhập để rời nhóm."), ct);
            return;
        }

        var result = await Mediator.Send(new LeaveGroupRoomCommand(req.RoomId, userId.Value), ct);
        if (result.IsSuccess)
        {
            await this.SendApiResponseAsync(Result<object>.Success(new { success = true }, result.Message ?? "Rời nhóm thành công."), ct);
        }
        else
        {
            await this.SendApiResponseAsync(result, ct);
        }
    }
}
