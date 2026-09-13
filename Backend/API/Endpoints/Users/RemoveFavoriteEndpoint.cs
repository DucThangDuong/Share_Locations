using API.Extensions;
using Application.Common;
using Application.Features.Users.Commands;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Users;

public class RemoveFavoriteRequest
{
    [BindFrom("targetType")]
    public int TargetType { get; set; }

    [BindFrom("targetId")]
    public long TargetId { get; set; }
}

public class RemoveFavoriteEndpoint : Endpoint<RemoveFavoriteRequest>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Delete("/api/v1/users/me/favorites/{targetType}/{targetId}", "/api/users/me/favorites/{targetType}/{targetId}");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Options(x => x.RequireRateLimiting("write_api"));
        Summary(s =>
        {
            s.Summary = "Xóa khỏi danh sách mục đã lưu";
            s.Description = "Bỏ lưu địa điểm, món ăn, lịch trình hoặc bài viết khỏi danh sách mục yêu thích của người dùng hiện tại.";
        });
    }

    public override async Task HandleAsync(RemoveFavoriteRequest req, CancellationToken ct)
    {
        var userId = this.GetUserId();
        if (!userId.HasValue)
        {
            await this.SendApiResponseAsync(
                Result.Unauthorized("Bạn cần đăng nhập để thao tác."),
                ct);
            return;
        }

        var result = await Mediator.Send(
            new RemoveFavoriteCommand(userId.Value, req.TargetType, req.TargetId),
            ct);

        await this.SendApiResponseAsync(result, ct);
    }
}
