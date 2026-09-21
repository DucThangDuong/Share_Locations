using API.DTOs;
using API.Extensions;
using Application.DTOs.Admin;
using Application.Features.Admin.Dashboard;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Dashboard;

public class GetAdminProvincesCompletenessEndpoint : EndpointWithoutRequest<ApiSuccessResponse<IReadOnlyList<AdminProvinceCompletenessDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/admin/provinces/completeness");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Theo dõi độ hoàn thiện số hóa tỉnh/thành (Admin)";
            s.Description = "Danh sách các tỉnh thành kèm số lượng địa điểm, món ăn và tỷ lệ hoàn thiện dữ liệu.";
        });
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetAdminProvincesCompletenessQuery(), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
