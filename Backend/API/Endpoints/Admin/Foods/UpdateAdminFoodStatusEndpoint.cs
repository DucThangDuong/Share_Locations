using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs.Admin;
using Application.Features.Admin.Foods;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Foods;

public class UpdateAdminFoodStatusRequest : UpdateEntityStatusInput
{
    public long Id { get; set; }
}

public class UpdateAdminFoodStatusEndpoint : Endpoint<UpdateAdminFoodStatusRequest, ApiSuccessResponse<bool>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Patch("/api/admin/foods/{id}/status");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Công khai hoặc Tạm ẩn món ăn (Admin)";
            s.Description = "Chuyển đổi trạng thái hoạt động (active) hoặc tạm ẩn (hidden) của món ăn.";
        });
    }

    public override async Task HandleAsync(UpdateAdminFoodStatusRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new UpdateAdminFoodStatusCommand(req.Id, req.Status), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
