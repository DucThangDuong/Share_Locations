using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs.Admin;
using Application.Features.Admin.Foods;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Foods;

public class CreateAdminFoodEndpoint : Endpoint<CreateAdminFoodInput, ApiSuccessResponse<long>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Post("/api/admin/foods");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Tạo mới món ăn đặc sản (Admin)";
            s.Description = "Thêm mới món ăn đặc sản vào hệ thống kèm theo tỉnh thành và mức giá.";
        });
    }

    public override async Task HandleAsync(CreateAdminFoodInput req, CancellationToken ct)
    {
        var result = await Mediator.Send(new CreateAdminFoodCommand(req), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
