using API.DTOs;
using API.Extensions;
using Application.DTOs.Admin;
using Application.Features.Admin.Geography;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Geography;

public class UpdateAdminRegionStatusApiRequest : UpdateAdminStatusRequest
{
    public int Id { get; set; }
}

public class UpdateAdminRegionStatusEndpoint : Endpoint<UpdateAdminRegionStatusApiRequest, ApiSuccessResponse<bool>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Put("/api/admin/geography/regions/{id}/status");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Kích hoạt / Ẩn Vùng/Miền (Admin)";
            s.Description = "Chỉ SystemAdmin mới có quyền bật tắt trạng thái hiển thị của vùng/miền.";
        });
    }

    public override async Task HandleAsync(UpdateAdminRegionStatusApiRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new UpdateAdminRegionStatusCommand(req.Id, req.Status, req.Reason), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
