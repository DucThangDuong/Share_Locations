using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.Features.Chat.Commands;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Chat;

public class AddMembersToRoomRequest
{
    public long RoomId { get; set; }
    public List<long> UserIds { get; set; } = new();
}

public class AddMembersToRoomEndpoint : Endpoint<AddMembersToRoomRequest, ApiSuccessResponse<object>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Post("/api/chat/rooms/{roomId}/members");
        Tags("Chat");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Mời thêm thành viên vào nhóm chat";
            s.Description = "Thêm một hoặc nhiều bạn bè vào phòng chat nhóm hiện có.";
        });
    }

    public override async Task HandleAsync(AddMembersToRoomRequest req, CancellationToken ct)
    {
        var userId = this.GetUserId();
        if (!userId.HasValue)
        {
            await this.SendApiResponseAsync(Result.Unauthorized("Bạn cần đăng nhập để thêm thành viên."), ct);
            return;
        }

        var result = await Mediator.Send(new AddMembersToRoomCommand(req.RoomId, userId.Value, req.UserIds), ct);
        if (result.IsSuccess)
        {
            await this.SendApiResponseAsync(Result<object>.Success(new { success = true }, "Thêm thành viên vào nhóm thành công."), ct);
        }
        else
        {
            await this.SendApiResponseAsync(result, ct);
        }
    }
}