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
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetFeaturedBlogQuery(), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
