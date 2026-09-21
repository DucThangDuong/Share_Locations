using API.DTOs;
using API.Extensions;
using Application.DTOs.Admin;
using Application.Features.Admin.Blogs;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Blogs;

public class GetAdminBlogDetailRequest
{
    public long Id { get; set; }
}

public class GetAdminBlogDetailEndpoint : Endpoint<GetAdminBlogDetailRequest, ApiSuccessResponse<AdminBlogDetailDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/admin/blogs/{id}");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Lấy chi tiết bài viết cẩm nang (Admin)";
            s.Description = "Chi tiết toàn văn bài viết cẩm nang gồm nội dung JSON/HTML, lượt xem, tác giả.";
        });
    }

    public override async Task HandleAsync(GetAdminBlogDetailRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetAdminBlogDetailQuery(req.Id), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
