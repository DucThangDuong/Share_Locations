using API.DTOs;
using API.Extensions;
using Application.DTOs.Admin;
using Application.Features.Admin.Users;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Users;

public class GetAdminUserAccessHistoryRequest
{
    public long UserId { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class GetAdminUserAccessHistoryEndpoint : Endpoint<GetAdminUserAccessHistoryRequest, ApiSuccessResponse<AdminAccessHistoryResultDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/admin/users/{userId}/access-history");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Lấy lịch sử thao tác kiểm toán của Admin cấp 1 (Access History / Audit Logs)";
            s.Description = "Chỉ SystemAdmin hoặc chính Admin đó mới có quyền xem lịch sử hoạt động.";
        });
    }

    public override async Task HandleAsync(GetAdminUserAccessHistoryRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(
            new GetAdminAccessHistoryQuery(req.UserId, req.Page, req.PageSize), ct);

        await this.SendApiResponseAsync(result, ct);
    }
}
