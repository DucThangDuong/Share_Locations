using API.DTOs;
using API.Extensions;
using Application.DTOs.Admin;
using Application.Features.Admin.AuditLogs;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.AuditLogs;

public class GetAdminAuditLogDetailRequest
{
    [BindFrom("id")]
    public long Id { get; set; }
}

public class GetAdminAuditLogDetailEndpoint : Endpoint<GetAdminAuditLogDetailRequest, ApiSuccessResponse<AdminAuditLogDetailDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/admin/audit-logs/{id}");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Xem chi tiết nhật ký kiểm toán (Audit Log Detail)";
            s.Description = "Xem thông tin chi tiết của một hành động kiểm toán, bao gồm dữ liệu cũ (OldDataJSON) và dữ liệu mới (NewDataJSON) để so sánh thay đổi.";
        });
    }

    public override async Task HandleAsync(GetAdminAuditLogDetailRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetAdminAuditLogDetailQuery(req.Id), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
