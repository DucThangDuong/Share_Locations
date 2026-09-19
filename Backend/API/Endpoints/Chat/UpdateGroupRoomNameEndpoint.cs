using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.Features.Chat.Commands;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Chat;

public class UpdateGroupRoomNameRequest
{
    public long RoomId { get; set; }
    public string Name { get; set; } = string.Empty;
}

public class UpdateGroupRoomNameEndpoint : Endpoint<UpdateGroupRoomNameRequest, ApiSuccessResponse<object>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Put("/api/chat/rooms/{roomId}/name");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Đổi tên nhóm chat";
            s.Description = "Cập nhật tên mới cho phòng chat nhóm.";
        });
    }

    public override async Task HandleAsync(UpdateGroupRoomNameRequest req, CancellationToken ct)
    {
        var userId = this.GetUserId();
        if (!userId.HasValue)
        {
            await this.SendApiResponseAsync(Result.Unauthorized("Bạn cần đăng nhập để đổi tên nhóm."), ct);
            return;
        }

        var result = await Mediator.Send(new UpdateGroupRoomNameCommand(req.RoomId, userId.Value, req.Name), ct);
        if (result.IsSuccess)
        {
            await this.SendApiResponseAsync(Result<object>.Success(new { success = true, name = req.Name }, "Đổi tên nhóm thành công."), ct);
        }
        else
        {
            await this.SendApiResponseAsync(result, ct);
        }
    }
}
