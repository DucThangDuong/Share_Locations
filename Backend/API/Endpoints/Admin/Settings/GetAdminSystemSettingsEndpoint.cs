using API.DTOs;
using API.Extensions;
using Application.DTOs.Admin;
using Application.Features.Admin.Settings;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Settings;

public class GetAdminSystemSettingsApiRequest
{
    public string? Group { get; set; }
}

public class GetAdminSystemSettingsEndpoint : Endpoint<GetAdminSystemSettingsApiRequest, ApiSuccessResponse<IReadOnlyList<AdminSystemSettingDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/admin/settings/system-settings");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Lấy danh sách các tham số cài đặt hệ thống (Admin)";
            s.Description = "Chỉ SystemAdmin mới có quyền xem các thiết lập vận hành hệ thống (GENERAL, MODERATION, SECURITY...).";
        });
    }

    public override async Task HandleAsync(GetAdminSystemSettingsApiRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetAdminSystemSettingsQuery(req.Group), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
