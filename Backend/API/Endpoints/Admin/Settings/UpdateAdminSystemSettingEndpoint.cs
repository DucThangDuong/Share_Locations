using API.DTOs;
using API.Extensions;
using Application.DTOs.Admin;
using Application.Features.Admin.Settings;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Settings;

public class UpdateAdminSystemSettingApiRequest : UpdateAdminSystemSettingRequest
{
    public string Key { get; set; } = string.Empty;
}

public class UpdateAdminSystemSettingEndpoint : Endpoint<UpdateAdminSystemSettingApiRequest, ApiSuccessResponse<bool>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Put("/api/admin/settings/system-settings/{key}");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Cập nhật giá trị một tham số cài đặt (Admin)";
            s.Description = "Chỉ SystemAdmin mới có quyền thay đổi giá trị của cấu hình hệ thống.";
        });
    }

    public override async Task HandleAsync(UpdateAdminSystemSettingApiRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new UpdateAdminSystemSettingCommand(req.Key, req.SettingValue, req.Description), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
