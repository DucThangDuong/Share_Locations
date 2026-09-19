using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.Features.Chat.Commands;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Chat;

public class RemoveMemberFromRoomRequest
{
    public long RoomId { get; set; }
    public long UserId { get; set; }
}

public class RemoveMemberFromRoomEndpoint : Endpoint<RemoveMemberFromRoomRequest, ApiSuccessResponse<object>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Delete("/api/chat/rooms/{roomId}/members/{userId}");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Xóa thành viên khỏi nhóm chat";
            s.Description = "Xóa một người dùng ra khỏi phòng chat nhóm.";
        });
    }

    public override async Task HandleAsync(RemoveMemberFromRoomRequest req, CancellationToken ct)
    {
        var requesterId = this.GetUserId();
        if (!requesterId.HasValue)
        {
            await this.SendApiResponseAsync(Result.Unauthorized("Bạn cần đăng nhập để thực hiện thao tác này."), ct);
            return;
        }

        var result = await Mediator.Send(new RemoveMemberFromRoomCommand(req.RoomId, requesterId.Value, req.UserId), ct);
        if (result.IsSuccess)
        {
            await this.SendApiResponseAsync(Result<object>.Success(new { success = true }, "Xóa thành viên khỏi nhóm thành công."), ct);
        }
        else
        {
            await this.SendApiResponseAsync(result, ct);
        }
    }
}
