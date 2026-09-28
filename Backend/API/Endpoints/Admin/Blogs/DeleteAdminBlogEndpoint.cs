using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.Features.Admin.Blogs;
using Domain.Constants;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Blogs;

public class DeleteAdminBlogRequest
{
    public long Id { get; set; }
}

public class DeleteAdminBlogEndpoint : Endpoint<DeleteAdminBlogRequest, ApiSuccessResponse<bool>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Delete("/api/admin/blogs/{id}");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles(AppRoles.SuperAdminOnly);
        Summary(s =>
        {
            s.Summary = "Xóa bài viết cẩm nang (Đặc quyền SystemAdmin)";
            s.Description = "Xóa vĩnh viễn bài viết cẩm nang khỏi hệ thống. Chỉ dành riêng cho Quản trị viên tối cao (SystemAdmin).";
        });
    }

    public override async Task HandleAsync(DeleteAdminBlogRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new DeleteAdminBlogCommand(req.Id), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
