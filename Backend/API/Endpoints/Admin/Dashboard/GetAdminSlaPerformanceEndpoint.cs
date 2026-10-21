using API.DTOs;
using API.Extensions;
using Application.DTOs.Admin;
using Application.Features.Admin.Dashboard;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Dashboard;

public class GetAdminSlaPerformanceEndpoint : EndpointWithoutRequest<ApiSuccessResponse<SlaPerformanceResponseDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/admin/dashboard/sla-performance");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Lấy tỷ lệ xử lý đúng hạn (SLA) và chất lượng dữ liệu";
            s.Description = "Cung cấp tỷ lệ duyệt đề xuất, tỷ lệ xử lý báo cáo đúng hạn SLA và phân bổ chất lượng thông tin địa điểm.";
        });
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetAdminSlaPerformanceQuery(), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
