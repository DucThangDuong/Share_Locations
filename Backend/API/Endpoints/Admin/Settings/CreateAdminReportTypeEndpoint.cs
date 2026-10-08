using API.DTOs;
using API.Extensions;
using Application.DTOs.Admin;
using Application.Features.Admin.Settings;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Settings;

public class CreateAdminReportTypeEndpoint : Endpoint<CreateAdminReportTypeRequest, ApiSuccessResponse<int>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Post("/api/admin/settings/report-types");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Thêm mới loại lý do báo cáo vi phạm (Admin)";
            s.Description = "Chỉ SystemAdmin mới có quyền tạo thêm loại lý do báo cáo vi phạm mới.";
        });
    }

    public override async Task HandleAsync(CreateAdminReportTypeRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new CreateAdminReportTypeCommand(req), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
