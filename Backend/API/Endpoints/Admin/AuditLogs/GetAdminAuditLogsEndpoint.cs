using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs.Admin;
using Application.Features.Admin.AuditLogs;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.AuditLogs;

public class GetAdminAuditLogsEndpoint : Endpoint<GetAdminAuditLogsRequestDto, ApiSuccessResponse<IReadOnlyList<AdminAuditLogListItemDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/admin/audit-logs");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Tra cứu nhật ký kiểm toán hệ thống (Audit Logs)";
            s.Description = "Truy xuất danh sách các hành động thay đổi dữ liệu của Admin và Admin cấp 1 với bộ lọc đa tiêu chí (AdminId, ActionType, TargetTable, thời gian, từ khóa).";
        });
    }

    public override async Task HandleAsync(GetAdminAuditLogsRequestDto req, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetAdminAuditLogsQuery(req), ct);
        await this.SendPagedApiResponseAsync(result, ct);
    }
}
