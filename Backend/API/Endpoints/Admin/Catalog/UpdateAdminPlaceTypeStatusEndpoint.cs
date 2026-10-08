using API.DTOs;
using API.Extensions;
using Application.DTOs.Admin;
using Application.Features.Admin.Catalog;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Catalog;

public class UpdateAdminPlaceTypeStatusApiRequest : UpdateAdminStatusRequest
{
    public int Id { get; set; }
}

public class UpdateAdminPlaceTypeStatusEndpoint : Endpoint<UpdateAdminPlaceTypeStatusApiRequest, ApiSuccessResponse<bool>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Put("/api/admin/catalog/place-types/{id}/status");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Kích hoạt / Tạm ẩn Loại địa điểm (Admin)";
            s.Description = "Chỉ SystemAdmin mới có quyền bật tắt trạng thái hiển thị của loại địa điểm.";
        });
    }

    public override async Task HandleAsync(UpdateAdminPlaceTypeStatusApiRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new UpdateAdminPlaceTypeStatusCommand(req.Id, req.Status, req.Reason), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
