using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs.Admin;
using Application.Features.Admin.Reviews;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Comments;

public class GetAdminCommentsRequest
{
    public bool? HasReportsOnly { get; set; }
    public string? Status { get; set; }
    public string? Keyword { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public class GetAdminCommentsEndpoint : Endpoint<GetAdminCommentsRequest, ApiSuccessResponse<IReadOnlyList<AdminCommentItemDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/admin/comments");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Lấy danh sách bình luận (Admin)";
            s.Description = "Danh sách bình luận phục vụ kiểm duyệt nội dung phản cảm hoặc spam.";
        });
    }

    public override async Task HandleAsync(GetAdminCommentsRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(
            new GetAdminCommentsQuery(
                req.HasReportsOnly,
                req.Status,
                req.Keyword,
                req.Page,
                req.PageSize),
            ct);

        await this.SendPagedApiResponseAsync(result, ct);
    }
}
