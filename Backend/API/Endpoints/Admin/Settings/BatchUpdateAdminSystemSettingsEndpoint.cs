using API.DTOs;
using API.Extensions;
using Application.DTOs.Admin;
using Application.Features.Admin.Settings;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Settings;

public class BatchUpdateAdminSystemSettingsEndpoint : Endpoint<BatchUpdateSystemSettingsRequest, ApiSuccessResponse<int>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Put("/api/admin/settings/system-settings/batch");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Cập nhật đồng loạt nhiều tham số cấu hình hệ thống (Admin)";
            s.Description = "Chỉ SystemAdmin mới có quyền cập nhật nhiều tham số hệ thống trong cùng một yêu cầu.";
        });
    }

    public override async Task HandleAsync(BatchUpdateSystemSettingsRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new BatchUpdateAdminSystemSettingsCommand(req.Settings), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
