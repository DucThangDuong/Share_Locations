using API.DTOs;
using API.Extensions;
using Application.DTOs.Admin;
using Application.Features.Admin.Geography;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Geography;

public class GetAdminProvinceDetailApiRequest
{
    public int Id { get; set; }
}

public class GetAdminProvinceDetailEndpoint : Endpoint<GetAdminProvinceDetailApiRequest, ApiSuccessResponse<AdminProvinceDetailDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/admin/geography/provinces/{id}");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Xem chi tiết Tỉnh/Thành phố (Admin)";
            s.Description = "Chi tiết tỉnh/thành kèm số lượng địa điểm, món ăn và số lượng admin được phân quyền.";
        });
    }

    public override async Task HandleAsync(GetAdminProvinceDetailApiRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetAdminProvinceByIdQuery(req.Id), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
