using API.DTOs;
using API.Extensions;
using Application.DTOs.Admin;
using Application.Features.Admin.Geography;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Geography;

public class CreateAdminProvinceEndpoint : Endpoint<CreateAdminProvinceRequest, ApiSuccessResponse<int>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Post("/api/admin/geography/provinces");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Thêm mới Tỉnh/Thành phố (Admin)";
            s.Description = "Chỉ SystemAdmin mới có quyền tạo thêm tỉnh/thành phố vào hệ thống.";
        });
    }

    public override async Task HandleAsync(CreateAdminProvinceRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new CreateAdminProvinceCommand(req), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
