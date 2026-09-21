using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs.Admin;
using Application.Features.Admin.Foods;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Foods;

public class UpdateAdminFoodRequest : UpdateAdminFoodInput
{
    public long Id { get; set; }
}

public class UpdateAdminFoodEndpoint : Endpoint<UpdateAdminFoodRequest, ApiSuccessResponse<bool>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Put("/api/admin/foods/{id}");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Cập nhật món ăn đặc sản (Admin)";
            s.Description = "Cập nhật thông tin chi tiết, giá tiền và tỉnh thành của món ăn.";
        });
    }

    public override async Task HandleAsync(UpdateAdminFoodRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new UpdateAdminFoodCommand(req.Id, req), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
