using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs.Admin;
using Application.Features.Admin.Blogs;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Blogs;

public class CreateAdminBlogEndpoint : Endpoint<CreateAdminBlogInput, ApiSuccessResponse<long>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Post("/api/admin/blogs");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Tạo mới bài viết cẩm nang (Admin)";
            s.Description = "Đăng tải bài viết cẩm nang du lịch, lịch trình gợi ý lên hệ thống.";
        });
    }

    public override async Task HandleAsync(CreateAdminBlogInput req, CancellationToken ct)
    {
        var adminId = this.GetUserId();
        var authorId = adminId ?? 1;

        var result = await Mediator.Send(new CreateAdminBlogCommand(req, authorId), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
