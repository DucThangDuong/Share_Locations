using API.DTOs;
using API.Extensions;
using Application.DTOs;
using Application.Features.Blogs.Queries;
using FastEndpoints;
using MediatR;

namespace API.Endpoints.Blogs;

public class GetFeaturedBlogEndpoint : EndpointWithoutRequest<ApiSuccessResponse<BlogListItemDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/v1/blogs/featured", "/api/blogs/featured");
        AllowAnonymous();
        Options(x => x.RequireRateLimiting("general_api"));
        Summary(s =>
        {
            s.Summary = "Lấy bài viết blog nổi bật";
            s.Description = "Lấy thông tin bài viết blog du lịch được đánh dấu nổi bật nhất để hiển thị tại trang chủ hoặc banner.";
        });
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetFeaturedBlogQuery(), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
