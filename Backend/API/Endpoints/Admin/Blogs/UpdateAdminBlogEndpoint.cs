using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs.Admin;
using Application.Features.Admin.Blogs;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Blogs;

public class UpdateAdminBlogRequest : UpdateAdminBlogInput
{
    public long Id { get; set; }
}

public class UpdateAdminBlogEndpoint : Endpoint<UpdateAdminBlogRequest, ApiSuccessResponse<bool>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Put("/api/admin/blogs/{id}");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Cập nhật bài viết cẩm nang (Admin)";
            s.Description = "Cập nhật nội dung toàn văn, tiêu đề, thời gian đọc của bài viết cẩm nang.";
        });
    }

    public override async Task HandleAsync(UpdateAdminBlogRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new UpdateAdminBlogCommand(req.Id, req), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
