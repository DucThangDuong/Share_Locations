using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Chat.Queries;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Chat;

public class GetInboxEndpoint : EndpointWithoutRequest<ApiSuccessResponse<IReadOnlyList<InboxItemDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/chat/inbox");
        Tags("Chat");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Lấy danh sách hộp thư (Inbox)";
            s.Description = "Trả về danh sách các phòng trò chuyện gần nhất của người dùng hiện tại kèm theo tin nhắn cuối cùng và số lượng tin nhắn chưa đọc.";
        });
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var userId = this.GetUserId();
        if (!userId.HasValue)
        {
            await this.SendApiResponseAsync(Result.Unauthorized("Bạn cần đăng nhập để truy cập hộp thư."), ct);
            return;
        }

        var result = await Mediator.Send(new GetInboxQuery(userId.Value), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
