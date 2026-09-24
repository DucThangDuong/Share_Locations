using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Users.Queries;
using FastEndpoints;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Blogs;

public class GetMyBlogsRequest
{
    [QueryParam]
    public int? Status { get; set; }

    [QueryParam]
    public int Page { get; set; } = 1;

    [QueryParam]
    public int PageSize { get; set; } = 10;
}

public class GetMyBlogsRequestValidator : Validator<GetMyBlogsRequest>
{
    public GetMyBlogsRequestValidator()
    {
        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1)
            .WithMessage("Số trang (page) phải lớn hơn hoặc bằng 1.");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 50)
            .WithMessage("Kích thước trang (pageSize) phải từ 1 đến 50.");
    }
}

public class GetMyBlogsEndpoint : Endpoint<GetMyBlogsRequest, ApiSuccessResponse<IReadOnlyList<UserBlogItemDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/blogs/my-blogs");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Options(x => x.RequireRateLimiting("general_api"));
        Summary(s =>
        {
            s.Summary = "Lấy danh sách bài viết blog của tôi";
            s.Description = "Lấy danh sách các bài viết cẩm nang du lịch do chính người dùng hiện tại biên tập (hỗ trợ lọc theo trạng thái và phân trang).";
        });
    }

    public override async Task HandleAsync(GetMyBlogsRequest req, CancellationToken ct)
    {
        var userId = this.GetUserId();
        if (!userId.HasValue)
        {
            await this.SendApiResponseAsync(
                Result<PagedResult<UserBlogItemDto>>.Unauthorized("Bạn cần đăng nhập để xem danh sách bài viết của mình."),
                ct);
            return;
        }

        var result = await Mediator.Send(
            new GetUserBlogsQuery(userId.Value, req.Status, req.Page, req.PageSize),
            ct);

        await this.SendPagedApiResponseAsync(result, ct);
    }
}
