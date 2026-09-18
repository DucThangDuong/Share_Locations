using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Blogs.Commands;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Blogs;

public class ToggleBlogLikeRequest
{
    public long Id { get; set; }
}

public class ToggleBlogLikeEndpoint : Endpoint<ToggleBlogLikeRequest, ApiSuccessResponse<BlogLikeResponseDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Post("/api/blogs/{id}/toggle-like");
        Tags("Blogs");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Options(x => x.RequireRateLimiting("write_api"));
        Summary(s =>
        {
            s.Summary = "Thả tim hoặc bỏ thích bài viết blog";
            s.Description = "Người dùng nhấn thích hoặc bỏ thích bài viết. Trả về trạng thái isLiked và tổng số lượt thích.";
        });
    }

    public override async Task HandleAsync(ToggleBlogLikeRequest req, CancellationToken ct)
    {
        var userId = this.GetUserId();
        if (!userId.HasValue)
        {
            await this.SendApiResponseAsync(
                Result<BlogLikeResponseDto>.Unauthorized("Bạn cần đăng nhập để thực hiện thao tác này."),
                ct);
            return;
        }

        var result = await Mediator.Send(new ToggleBlogLikeCommand(req.Id, userId.Value), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
