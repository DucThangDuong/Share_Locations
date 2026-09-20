using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Chat.Commands;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Chat;

public class EditMessageRequest
{
    public long MessageId { get; set; }
    public string Content { get; set; } = string.Empty;
}

public class EditMessageEndpoint : Endpoint<EditMessageRequest, ApiSuccessResponse<ChatMessageDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Put("/api/chat/messages/{messageId}");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Chỉnh sửa tin nhắn";
            s.Description = "Chỉnh sửa nội dung tin nhắn đã gửi của chính mình và đồng bộ thời gian thực qua SignalR.";
        });
    }

    public override async Task HandleAsync(EditMessageRequest req, CancellationToken ct)
    {
        var userId = this.GetUserId();
        if (!userId.HasValue)
        {
            await this.SendApiResponseAsync(Result<ChatMessageDto>.Unauthorized("Bạn cần đăng nhập để chỉnh sửa tin nhắn."), ct);
            return;
        }

        var result = await Mediator.Send(new EditMessageCommand(req.MessageId, userId.Value, req.Content), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
