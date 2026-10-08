using API.DTOs;
using API.Extensions;
using Application.Features.Admin.Settings;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Settings;

public class UpdateAdminReportTypeStatusApiRequest
{
    public int Id { get; set; }
    public bool IsActive { get; set; }
}

public class UpdateAdminReportTypeStatusEndpoint : Endpoint<UpdateAdminReportTypeStatusApiRequest, ApiSuccessResponse<bool>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Put("/api/admin/settings/report-types/{id}/status");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Bật / Tắt kích hoạt lý do báo cáo (Admin)";
            s.Description = "Chỉ SystemAdmin mới có quyền bật tắt trạng thái áp dụng lý do báo cáo vi phạm.";
        });
    }

    public override async Task HandleAsync(UpdateAdminReportTypeStatusApiRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new UpdateAdminReportTypeStatusCommand(req.Id, req.IsActive), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
