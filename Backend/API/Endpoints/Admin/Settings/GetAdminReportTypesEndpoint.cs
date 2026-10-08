using API.DTOs;
using API.Extensions;
using Application.DTOs.Admin;
using Application.Features.Admin.Settings;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Settings;

public class GetAdminReportTypesApiRequest
{
    public string? TargetScope { get; set; }
    public bool? ActiveOnly { get; set; }
}

public class GetAdminReportTypesEndpoint : Endpoint<GetAdminReportTypesApiRequest, ApiSuccessResponse<IReadOnlyList<AdminReportTypeListItemDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/admin/settings/report-types");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Lấy danh sách các lý do báo cáo vi phạm (Admin)";
            s.Description = "Danh sách lý do báo cáo vi phạm kèm số lượng báo cáo đã tiếp nhận.";
        });
    }

    public override async Task HandleAsync(GetAdminReportTypesApiRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetAdminReportTypesQuery(req.TargetScope, req.ActiveOnly), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
