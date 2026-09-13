using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Blogs.Commands;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Blogs;

public class UpdateBlogRequest
{
    [BindFrom("id")]
    public long Id { get; set; }

    [FromBody]
    public UpdateBlogRequestDto Body { get; set; } = null!;
}

public class UpdateBlogEndpoint : Endpoint<UpdateBlogRequest>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Put("/api/v1/blogs/{id}", "/api/blogs/{id}");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Options(x => x.RequireRateLimiting("write_api"));
        Summary(s =>
        {
            s.Summary = "Chỉnh sửa bài viết blog";
            s.Description = "Tác giả chỉnh sửa nội dung bài viết blog cá nhân.";
        });
    }

    public override async Task HandleAsync(UpdateBlogRequest req, CancellationToken ct)
    {
        var userId = this.GetUserId();
        if (!userId.HasValue)
        {
            await this.SendApiResponseAsync(
                Result.Unauthorized("Bạn cần đăng nhập để thao tác."),
                ct);
            return;
        }

        var result = await Mediator.Send(new UpdateBlogCommand(req.Id, userId.Value, req.Body), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
