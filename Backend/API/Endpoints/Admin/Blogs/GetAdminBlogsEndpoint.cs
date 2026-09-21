using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs.Admin;
using Application.Features.Admin.Blogs;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Blogs;

public class GetAdminBlogsRequest
{
    public int? CategoryId { get; set; }
    public string? Status { get; set; }
    public string? Keyword { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public class GetAdminBlogsEndpoint : Endpoint<GetAdminBlogsRequest, ApiSuccessResponse<IReadOnlyList<AdminBlogListItemDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/admin/blogs");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Lấy danh sách bài viết cẩm nang (Admin)";
            s.Description = "Danh sách bài viết cẩm nang du lịch phục vụ biên tập và quản trị.";
        });
    }

    public override async Task HandleAsync(GetAdminBlogsRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(
            new GetAdminBlogsQuery(
                req.CategoryId,
                req.Status,
                req.Keyword,
                req.Page,
                req.PageSize),
            ct);

        await this.SendPagedApiResponseAsync(result, ct);
    }
}
