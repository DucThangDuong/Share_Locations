using API.DTOs;
using API.Extensions;
using Application.DTOs;
using Application.Features.Blogs.Queries;
using FastEndpoints;
using MediatR;

namespace API.Endpoints.Blogs;

public class GetBlogDetailRequest
{
    [BindFrom("idOrSlug")]
    public string IdOrSlug { get; set; } = string.Empty;
}

public class GetBlogDetailEndpoint : Endpoint<GetBlogDetailRequest, ApiSuccessResponse<BlogDetailDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/v1/blogs/{idOrSlug}", "/api/blogs/{idOrSlug}");
        AllowAnonymous();
        Options(x => x.RequireRateLimiting("general_api"));
        Summary(s =>
        {
            s.Summary = "Lấy chi tiết bài viết blog";
            s.Description = "Lấy toàn bộ nội dung chi tiết bài viết blog du lịch theo định danh ID hoặc đường dẫn thân thiện slug.";
        });
    }

    public override async Task HandleAsync(GetBlogDetailRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetBlogDetailQuery(req.IdOrSlug), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
