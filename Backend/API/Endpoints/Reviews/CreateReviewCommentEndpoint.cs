using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using API.DTOs;
using API.DTOs.Reviews;
using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Reviews.Commands;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Reviews;

public class CreateReviewCommentEndpoint : Endpoint<CreateReviewCommentRequest, ApiSuccessResponse<CommentDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Post("/api/v1/reviews/{id}/comments", "/api/reviews/{id}/comments");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Options(x => x.RequireRateLimiting("write_api"));
        Summary(s =>
        {
            s.Summary = "Bình luận hoặc trả lời bình luận trong bài đánh giá";
            s.Description = "Thêm bình luận mới vào bài đánh giá, hoặc trả lời một bình luận khác khi truyền parentId.";
        });
    }

    public override async Task HandleAsync(CreateReviewCommentRequest req, CancellationToken ct)
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
            ?? User.FindFirst("sub")?.Value;

        if (!long.TryParse(userIdStr, out var userId))
        {
            await this.SendApiResponseAsync(
                Result<CommentDto>.Unauthorized("Bạn cần đăng nhập để gửi bình luận."),
                ct);
            return;
        }

        var result = await Mediator.Send(
            new CreateReviewCommentCommand(req.ReviewId, userId, req.Content, req.ParentId),
            ct);

        await this.SendApiResponseAsync(result, ct);
    }
}
