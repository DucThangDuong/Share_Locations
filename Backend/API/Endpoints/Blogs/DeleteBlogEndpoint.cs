using API.Extensions;
using Application.Common;
using Application.Features.Blogs.Commands;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Blogs;

public class DeleteBlogRequest
{
    [BindFrom("id")]
    public long Id { get; set; }
}

public class DeleteBlogEndpoint : Endpoint<DeleteBlogRequest>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Delete("/api/v1/blogs/{id}", "/api/blogs/{id}");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Options(x => x.RequireRateLimiting("write_api"));
        Summary(s =>
        {
            s.Summary = "Xóa bài viết blog";
            s.Description = "Tác giả xóa bài viết blog cá nhân của mình.";
        });
    }

    public override async Task HandleAsync(DeleteBlogRequest req, CancellationToken ct)
    {
        var userId = this.GetUserId();
        if (!userId.HasValue)
        {
            await this.SendApiResponseAsync(
                Result.Unauthorized("Bạn cần đăng nhập để thao tác."),
                ct);
            return;
        }

        var result = await Mediator.Send(new DeleteBlogCommand(req.Id, userId.Value), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
