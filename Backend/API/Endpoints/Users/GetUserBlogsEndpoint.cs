using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Users.Queries;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Users;

public class GetUserBlogsRequest
{
    [QueryParam]
    public int? Status { get; set; }

    [QueryParam]
    public int Page { get; set; } = 1;

    [QueryParam]
    public int PageSize { get; set; } = 12;
}

public class GetUserBlogsEndpoint : Endpoint<GetUserBlogsRequest, ApiSuccessResponse<IReadOnlyList<UserBlogItemDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/v1/users/me/blogs", "/api/users/me/blogs");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Options(x => x.RequireRateLimiting("general_api"));
        Summary(s =>
        {
            s.Summary = "Lấy danh sách bài viết blog của tôi";
            s.Description = "Lấy danh sách các bài viết cẩm nang du lịch do chính người dùng hiện tại biên tập.";
        });
    }

    public override async Task HandleAsync(GetUserBlogsRequest req, CancellationToken ct)
    {
        var userId = this.GetUserId();
        if (!userId.HasValue)
        {
            await this.SendApiResponseAsync(
                Result<PagedResult<UserBlogItemDto>>.Unauthorized("Bạn cần đăng nhập để xem bài viết."),
                ct);
            return;
        }

        var result = await Mediator.Send(
            new GetUserBlogsQuery(userId.Value, req.Status, req.Page, req.PageSize),
            ct);

        await this.SendPagedApiResponseAsync(result, ct);
    }
}
