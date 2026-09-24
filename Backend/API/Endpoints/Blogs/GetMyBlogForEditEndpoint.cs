using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Blogs.Queries;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Blogs;

public class GetMyBlogForEditRequest
{
    [BindFrom("id")]
    public long Id { get; set; }
}

public class GetMyBlogForEditEndpoint : Endpoint<GetMyBlogForEditRequest, ApiSuccessResponse<BlogForEditDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/blogs/my-blogs/{id}");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Options(x => x.RequireRateLimiting("general_api"));
        Summary(s =>
        {
            s.Summary = "Lấy chi tiết bài viết blog của tôi để chỉnh sửa";
            s.Description = "Lấy dữ liệu bài viết (tiêu đề, tóm tắt, nội dung ContentJSON, danh mục, hình ảnh...) của chính tác giả để điền vào form chỉnh sửa.";
        });
    }

    public override async Task HandleAsync(GetMyBlogForEditRequest req, CancellationToken ct)
    {
        var userId = this.GetUserId();
        if (!userId.HasValue)
        {
            await this.SendApiResponseAsync(
                Result<BlogForEditDto>.Unauthorized("Bạn cần đăng nhập để thao tác."),
                ct);
            return;
        }

        var result = await Mediator.Send(new GetMyBlogForEditQuery(req.Id, userId.Value), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
