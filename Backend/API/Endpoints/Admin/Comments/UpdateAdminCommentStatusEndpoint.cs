using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs.Admin;
using Application.Features.Admin.Reviews;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Comments;

public class UpdateAdminCommentStatusRequest : UpdateEntityStatusInput
{
    public long Id { get; set; }
}

public class UpdateAdminCommentStatusEndpoint : Endpoint<UpdateAdminCommentStatusRequest, ApiSuccessResponse<bool>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Patch("/api/admin/comments/{id}/status");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Ẩn hoặc Hiện bình luận (Admin)";
            s.Description = "Chuyển đổi trạng thái ẩn (hidden) hoặc công khai (active) của bình luận.";
        });
    }

    public override async Task HandleAsync(UpdateAdminCommentStatusRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new UpdateAdminCommentStatusCommand(req.Id, req.Status), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
