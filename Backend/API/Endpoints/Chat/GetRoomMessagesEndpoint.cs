using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Chat.Queries;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Chat;

public class GetRoomMessagesRequest
{
    public long RoomId { get; set; }
    public int Page { get; set; } = 1;
    public int Limit { get; set; } = 20;
}

public class GetRoomMessagesEndpoint : Endpoint<GetRoomMessagesRequest, ApiSuccessResponse<IReadOnlyList<ChatMessageDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/chat/rooms/{roomId}/messages");
        Tags("Chat");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Lấy lịch sử tin nhắn phòng trò chuyện";
            s.Description = "Lấy danh sách tin nhắn theo phân trang kèm thông tin tệp đính kèm, cảm xúc (reactions) và trích dẫn trả lời (reply).";
        });
    }

    public override async Task HandleAsync(GetRoomMessagesRequest req, CancellationToken ct)
    {
        var userId = this.GetUserId();
        if (!userId.HasValue)
        {
            await this.SendApiResponseAsync(Result.Unauthorized("Bạn cần đăng nhập để xem tin nhắn."), ct);
            return;
        }

        var result = await Mediator.Send(new GetRoomMessagesQuery(req.RoomId, userId.Value, req.Page, req.Limit), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
