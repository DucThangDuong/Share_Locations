using API.DTOs;
using API.Extensions;
using Application.DTOs.Admin;
using Application.Features.Admin.Geography;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Geography;

public class GetAdminRegionsEndpoint : EndpointWithoutRequest<ApiSuccessResponse<IReadOnlyList<AdminRegionListItemDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/admin/geography/regions");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Lấy danh sách các Vùng/Miền (Admin)";
            s.Description = "Danh sách toàn bộ các vùng/miền kèm số lượng tỉnh thành trực thuộc và trạng thái.";
        });
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetAdminRegionsQuery(), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
