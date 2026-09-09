using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.Features.Reviews.Commands;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Reviews;

public class DeleteReviewCommentRequest
{
    [BindFrom("id")]
    public long Id { get; set; }
}

public class DeleteReviewCommentEndpoint : Endpoint<DeleteReviewCommentRequest, ApiSuccessResponse<bool>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Delete("/api/v1/reviews/comments/{id}", "/api/reviews/comments/{id}", "/api/v1/comments/{id}");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Options(x => x.RequireRateLimiting("write_api"));
        Summary(s =>
        {
            s.Summary = "Xóa bình luận";
            s.Description = "Xóa bình luận trong bài đánh giá (chỉ người tạo hoặc quản trị viên).";
        });
    }

    public override async Task HandleAsync(DeleteReviewCommentRequest req, CancellationToken ct)
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
            ?? User.FindFirst("sub")?.Value;

        if (!long.TryParse(userIdStr, out var userId))
        {
            await this.SendApiResponseAsync(
                Result<bool>.Unauthorized("Bạn cần đăng nhập để thực hiện thao tác này."),
                ct);
            return;
        }

        var isAdmin = User.IsInRole("SystemAdmin") || User.IsInRole("CategoryAdmin");

        var result = await Mediator.Send(
            new DeleteReviewCommentCommand(req.Id, userId, isAdmin),
            ct);

        await this.SendApiResponseAsync(result, ct);
    }
}
