using API.DTOs;
using API.Extensions;
using Application.Features.Admin.Settings;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Settings;

public class DeleteAdminReportTypeApiRequest
{
    public int Id { get; set; }
}

public class DeleteAdminReportTypeEndpoint : Endpoint<DeleteAdminReportTypeApiRequest, ApiSuccessResponse<bool>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Delete("/api/admin/settings/report-types/{id}");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Xóa lý do báo cáo vi phạm (Admin)";
            s.Description = "Chỉ xóa được khi chưa có báo cáo nào sử dụng lý do này.";
        });
    }

    public override async Task HandleAsync(DeleteAdminReportTypeApiRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new DeleteAdminReportTypeCommand(req.Id), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
