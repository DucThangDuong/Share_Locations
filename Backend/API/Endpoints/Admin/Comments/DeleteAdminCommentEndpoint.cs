using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.Features.Admin.Reviews;
using Domain.Constants;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Comments;

public class DeleteAdminCommentRequest
{
    public long Id { get; set; }
}

public class DeleteAdminCommentEndpoint : Endpoint<DeleteAdminCommentRequest, ApiSuccessResponse<bool>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Delete("/api/admin/comments/{id}");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles(AppRoles.SuperAdminOnly);
        Summary(s =>
        {
            s.Summary = "Xóa bình luận vi phạm (Đặc quyền SystemAdmin)";
            s.Description = "Xóa vĩnh viễn bình luận khỏi hệ thống. Chỉ dành riêng cho Quản trị viên tối cao (SystemAdmin).";
        });
    }

    public override async Task HandleAsync(DeleteAdminCommentRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new DeleteAdminCommentCommand(req.Id), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
