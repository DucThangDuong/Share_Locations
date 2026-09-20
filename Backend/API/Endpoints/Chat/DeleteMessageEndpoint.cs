using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.Features.Chat.Commands;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Chat;

public class DeleteMessageRequest
{
    public long MessageId { get; set; }
}

public class DeleteMessageEndpoint : Endpoint<DeleteMessageRequest, ApiSuccessResponse<bool>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Delete("/api/chat/messages/{messageId}");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Xóa tin nhắn";
            s.Description = "Xóa tin nhắn đã gửi của chính mình trong phòng trò chuyện và thông báo cho các thành viên qua SignalR.";
        });
    }

    public override async Task HandleAsync(DeleteMessageRequest req, CancellationToken ct)
    {
        var userId = this.GetUserId();
        if (!userId.HasValue)
        {
            await this.SendApiResponseAsync(Result<bool>.Unauthorized("Bạn cần đăng nhập để xóa tin nhắn."), ct);
            return;
        }

        var result = await Mediator.Send(new DeleteMessageCommand(req.MessageId, userId.Value), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
