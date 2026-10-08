using API.DTOs;
using API.Extensions;
using Application.DTOs.Admin;
using Application.Features.Admin.Catalog;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Catalog;

public class UpdateAdminCategoryStatusApiRequest : UpdateAdminStatusRequest
{
    public int Id { get; set; }
}

public class UpdateAdminCategoryStatusEndpoint : Endpoint<UpdateAdminCategoryStatusApiRequest, ApiSuccessResponse<bool>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Put("/api/admin/catalog/categories/{id}/status");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Kích hoạt / Tạm ẩn Danh mục (Admin)";
            s.Description = "Chỉ SystemAdmin mới có quyền bật tắt trạng thái hiển thị của danh mục.";
        });
    }

    public override async Task HandleAsync(UpdateAdminCategoryStatusApiRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new UpdateAdminCategoryStatusCommand(req.Id, req.Status, req.Reason), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
