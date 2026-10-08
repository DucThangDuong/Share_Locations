using API.DTOs;
using API.Extensions;
using Application.DTOs.Admin;
using Application.Features.Admin.Geography;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Geography;

public class CreateAdminRegionEndpoint : Endpoint<CreateAdminRegionRequest, ApiSuccessResponse<int>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Post("/api/admin/geography/regions");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Thêm mới Vùng/Miền (Admin)";
            s.Description = "Chỉ SystemAdmin mới có quyền tạo thêm vùng/miền mới vào hệ thống.";
        });
    }

    public override async Task HandleAsync(CreateAdminRegionRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new CreateAdminRegionCommand(req), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
