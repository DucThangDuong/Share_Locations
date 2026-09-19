using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Chat.Queries;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Chat;

public class GetRoomMembersRequest
{
    public long RoomId { get; set; }
}

public class GetRoomMembersEndpoint : Endpoint<GetRoomMembersRequest, ApiSuccessResponse<IReadOnlyList<ChatRoomMemberDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/chat/rooms/{roomId}/members");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Lấy danh sách thành viên phòng chat";
            s.Description = "Trả về danh sách tất cả thành viên trong phòng chat, trong đó người tạo nhóm đầu tiên là quản trị viên (IsAdmin = true, Role = 'Admin').";
        });
    }

    public override async Task HandleAsync(GetRoomMembersRequest req, CancellationToken ct)
    {
        var userId = this.GetUserId();
        if (!userId.HasValue)
        {
            await this.SendApiResponseAsync(Result.Unauthorized("Bạn cần đăng nhập để xem thành viên phòng chat."), ct);
            return;
        }

        var result = await Mediator.Send(new GetRoomMembersQuery(req.RoomId, userId.Value), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}