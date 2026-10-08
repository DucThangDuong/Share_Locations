using API.DTOs;
using API.Extensions;
using Application.DTOs.Admin;
using Application.Features.Admin.Settings;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Settings;

public class UpdateAdminReportTypeApiRequest : UpdateAdminReportTypeRequest
{
    public int Id { get; set; }
}

public class UpdateAdminReportTypeEndpoint : Endpoint<UpdateAdminReportTypeApiRequest, ApiSuccessResponse<bool>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Put("/api/admin/settings/report-types/{id}");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Cập nhật loại lý do báo cáo vi phạm (Admin)";
            s.Description = "Chỉ SystemAdmin mới có quyền chỉnh sửa thông tin lý do báo cáo vi phạm.";
        });
    }

    public override async Task HandleAsync(UpdateAdminReportTypeApiRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new UpdateAdminReportTypeCommand(req.Id, req), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
