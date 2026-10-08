using API.DTOs;
using API.Extensions;
using Application.DTOs.Admin;
using Application.Features.Admin.Geography;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Geography;

public class UpdateAdminProvinceStatusApiRequest : UpdateAdminStatusRequest
{
    public int Id { get; set; }
}

public class UpdateAdminProvinceStatusEndpoint : Endpoint<UpdateAdminProvinceStatusApiRequest, ApiSuccessResponse<bool>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Put("/api/admin/geography/provinces/{id}/status");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Kích hoạt / Ẩn Tỉnh/Thành phố (Admin)";
            s.Description = "Chỉ SystemAdmin mới có quyền bật tắt trạng thái hiển thị của tỉnh/thành phố.";
        });
    }

    public override async Task HandleAsync(UpdateAdminProvinceStatusApiRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new UpdateAdminProvinceStatusCommand(req.Id, req.Status, req.Reason), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
