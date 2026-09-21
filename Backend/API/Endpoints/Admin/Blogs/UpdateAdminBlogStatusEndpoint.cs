using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs.Admin;
using Application.Features.Admin.Blogs;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Blogs;

public class UpdateAdminBlogStatusRequest : UpdateBlogStatusInput
{
    public long Id { get; set; }
}

public class UpdateAdminBlogStatusEndpoint : Endpoint<UpdateAdminBlogStatusRequest, ApiSuccessResponse<bool>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Patch("/api/admin/blogs/{id}/status");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Chuyển đổi trạng thái bài viết cẩm nang (Admin)";
            s.Description = "Xuất bản (published), Lưu nháp (draft), hoặc Tạm ẩn (hidden) bài viết.";
        });
    }

    public override async Task HandleAsync(UpdateAdminBlogStatusRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new UpdateAdminBlogStatusCommand(req.Id, req.Status), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
