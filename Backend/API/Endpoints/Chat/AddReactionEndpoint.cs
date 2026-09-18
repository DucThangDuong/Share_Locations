using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.Features.Chat.Commands;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Chat;

public class AddReactionRequest
{
    public long MessageId { get; set; }
    public long RoomId { get; set; }
    public string Emoji { get; set; } = string.Empty;
}

public class AddReactionEndpoint : Endpoint<AddReactionRequest, ApiSuccessResponse<object>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Post("/api/chat/messages/{messageId}/reactions");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Thả cảm xúc cho tin nhắn";
            s.Description = "Thêm hoặc cập nhật biểu tượng cảm xúc (emoji) cho tin nhắn và phát sự kiện thời gian thực qua SignalR.";
        });
    }

    public override async Task HandleAsync(AddReactionRequest req, CancellationToken ct)
    {
        var userId = this.GetUserId();
        if (!userId.HasValue)
        {
            await this.SendApiResponseAsync(Result.Unauthorized("Bạn cần đăng nhập để thực hiện thao tác này."), ct);
            return;
        }

        var result = await Mediator.Send(new AddMessageReactionCommand(req.RoomId, req.MessageId, userId.Value, req.Emoji), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
