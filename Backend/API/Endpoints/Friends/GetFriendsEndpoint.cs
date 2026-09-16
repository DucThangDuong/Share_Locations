using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Friends.Queries;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Friends;

public class GetFriendsEndpoint : Endpoint<EmptyRequest, ApiSuccessResponse<FriendsResponseDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/v1/users/me/friends");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Options(x => x.RequireRateLimiting("general_api"));
        Summary(s =>
        {
            s.Summary = "Lấy danh sách bạn bè và lời mời kết bạn";
            s.Description = "Lấy danh sách bạn bè, lời mời đã nhận và lời mời đã gửi của người dùng hiện tại.";
        });
    }

    public override async Task HandleAsync(EmptyRequest req, CancellationToken ct)
    {
        var userId = this.GetUserId();
        if (!userId.HasValue)
        {
            await this.SendApiResponseAsync(
                Result<FriendsResponseDto>.Unauthorized("Bạn cần đăng nhập để xem danh sách bạn bè."),
                ct);
            return;
        }

        var result = await Mediator.Send(new GetMyFriendsQuery(userId.Value), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
