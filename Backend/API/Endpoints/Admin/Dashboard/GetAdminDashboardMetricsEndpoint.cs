using API.DTOs;
using API.Extensions;
using Application.DTOs.Admin;
using Application.Features.Admin.Dashboard;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Dashboard;

public class GetAdminDashboardMetricsEndpoint : EndpointWithoutRequest<ApiSuccessResponse<AdminDashboardMetricsDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/admin/dashboard/metrics");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Lấy chỉ số KPI Dashboard quản trị (Admin)";
            s.Description = "Tổng hợp các số liệu KPI theo thời gian thực: tổng địa điểm, đề xuất chờ duyệt, báo cáo chưa xử lý, món ăn, blog.";
        });
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetAdminDashboardMetricsQuery(), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
