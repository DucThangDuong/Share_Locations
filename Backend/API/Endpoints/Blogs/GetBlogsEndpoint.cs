using API.DTOs;
using API.DTOs.Blogs;
using API.Extensions;
using Application.DTOs;
using Application.Features.Blogs.Queries;
using FastEndpoints;
using MediatR;

namespace API.Endpoints.Blogs;

public class GetBlogsEndpoint : Endpoint<GetBlogsRequest, ApiSuccessResponse<IReadOnlyList<BlogListItemDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/v1/blogs", "/api/blogs");
        AllowAnonymous();
        Options(x => x.RequireRateLimiting("general_api"));
        Summary(s =>
        {
            s.Summary = "Lấy danh sách bài viết blog";
            s.Description = "Tìm kiếm và lấy danh sách các bài viết chia sẻ kinh nghiệm du lịch, có hỗ trợ lọc theo danh mục, từ khóa và phân trang.";
        });
    }

    public override async Task HandleAsync(GetBlogsRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(
            new GetBlogsQuery(
                req.Category,
                req.Keyword,
                req.Page,
                req.PageSize),
            ct);

        await this.SendApiResponseAsync(result, ct);
    }
}
