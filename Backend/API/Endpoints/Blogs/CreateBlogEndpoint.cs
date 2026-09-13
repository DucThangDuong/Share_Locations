using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Blogs.Commands;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Blogs;

public class CreateBlogEndpoint : Endpoint<CreateBlogRequestDto, ApiSuccessResponse<UserBlogItemDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Post("/api/v1/blogs", "/api/blogs");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Options(x => x.RequireRateLimiting("write_api"));
        Summary(s =>
        {
            s.Summary = "Tạo bài viết blog mới";
            s.Description = "Người dùng đăng bài viết chia sẻ kinh nghiệm du lịch (có thể lưu nháp hoặc xuất bản).";
        });
    }

    public override async Task HandleAsync(CreateBlogRequestDto req, CancellationToken ct)
    {
        var userId = this.GetUserId();
        if (!userId.HasValue)
        {
            await this.SendApiResponseAsync(
                Result<UserBlogItemDto>.Unauthorized("Bạn cần đăng nhập để tạo bài viết."),
                ct);
            return;
        }

        var result = await Mediator.Send(new CreateBlogCommand(userId.Value, req), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
