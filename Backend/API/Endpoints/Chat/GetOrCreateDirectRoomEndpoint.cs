using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.Features.Chat.Commands;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Chat;

public class GetOrCreateDirectRoomRequest
{
    public long TargetUserId { get; set; }
}

public class GetOrCreateDirectRoomEndpoint : Endpoint<GetOrCreateDirectRoomRequest, ApiSuccessResponse<object>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Post("/api/chat/direct/{targetUserId}");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Lấy hoặc tạo phòng trò chuyện 1-1";
            s.Description = "Kiểm tra và trả về phòng trò chuyện giữa người dùng hiện tại và TargetUser. Nếu chưa tồn tại sẽ tự động khởi tạo mới.";
        });
    }

    public override async Task HandleAsync(GetOrCreateDirectRoomRequest req, CancellationToken ct)
    {
        var userId = this.GetUserId();
        if (!userId.HasValue)
        {
            await this.SendApiResponseAsync(Result.Unauthorized("Bạn cần đăng nhập để khởi tạo trò chuyện."), ct);
            return;
        }

        var result = await Mediator.Send(new GetOrCreateDirectRoomCommand(userId.Value, req.TargetUserId), ct);
        if (result.IsSuccess)
        {
            await this.SendApiResponseAsync(Result<object>.Success(new { roomId = result.Data }, "Lấy phòng trò chuyện thành công."), ct);
        }
        else
        {
            await this.SendApiResponseAsync(result, ct);
        }
    }
}
