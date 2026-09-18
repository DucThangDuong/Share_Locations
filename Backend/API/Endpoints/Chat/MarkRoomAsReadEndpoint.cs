using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.Features.Chat.Commands;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Chat;

public class MarkRoomAsReadRequest
{
    public long RoomId { get; set; }
}

public class MarkRoomAsReadEndpoint : Endpoint<MarkRoomAsReadRequest, ApiSuccessResponse<object>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Put("/api/chat/rooms/{roomId}/read");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Đánh dấu đã đọc phòng trò chuyện";
            s.Description = "Cập nhật thời điểm đọc tin nhắn của người dùng hiện tại và gửi thông báo đã đọc qua SignalR.";
        });
    }

    public override async Task HandleAsync(MarkRoomAsReadRequest req, CancellationToken ct)
    {
        var userId = this.GetUserId();
        if (!userId.HasValue)
        {
            await this.SendApiResponseAsync(Result.Unauthorized("Bạn cần đăng nhập để thực hiện thao tác này."), ct);
            return;
        }

        var result = await Mediator.Send(new MarkRoomAsReadCommand(req.RoomId, userId.Value), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
