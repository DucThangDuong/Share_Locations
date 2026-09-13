using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Users.Commands;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Users;

public class AddFavoriteRequest
{
    [BindFrom("targetType")]
    public int? RouteTargetType { get; set; }

    [BindFrom("targetId")]
    public long? RouteTargetId { get; set; }

    [FromBody]
    public AddFavoriteRequestDto? Body { get; set; }
}

public class AddFavoriteEndpoint : Endpoint<AddFavoriteRequest, ApiSuccessResponse<AddFavoriteResponseDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Post(
            "/api/v1/users/me/favorites",
            "/api/users/me/favorites",
            "/api/v1/users/me/favorites/{targetType}/{targetId}",
            "/api/users/me/favorites/{targetType}/{targetId}");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Options(x => x.RequireRateLimiting("write_api"));
        Summary(s =>
        {
            s.Summary = "Thêm vào danh sách yêu thích";
            s.Description = "Lưu địa điểm, ẩm thực, lịch trình hoặc bài viết vào danh sách mục yêu thích của người dùng hiện tại.";
        });
    }

    public override async Task HandleAsync(AddFavoriteRequest req, CancellationToken ct)
    {
        var userId = this.GetUserId();
        if (!userId.HasValue)
        {
            await this.SendApiResponseAsync(
                Result<AddFavoriteResponseDto>.Unauthorized("Bạn cần đăng nhập để thực hiện thao tác này."),
                ct);
            return;
        }

        var targetType = req.RouteTargetType ?? req.Body?.TargetType ?? 0;
        var targetId = req.RouteTargetId ?? req.Body?.TargetId ?? 0;

        if (targetType <= 0 || targetId <= 0)
        {
            await this.SendApiResponseAsync(
                Result<AddFavoriteResponseDto>.Failure("targetType và targetId phải lớn hơn 0."),
                ct);
            return;
        }

        var result = await Mediator.Send(
            new AddFavoriteCommand(userId.Value, targetType, targetId),
            ct);

        await this.SendApiResponseAsync(result, ct);
    }
}
