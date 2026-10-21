using API.DTOs;
using API.Extensions;
using Application.DTOs.Admin;
using Application.Features.Admin.Dashboard;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Dashboard;

public class GetAdminDashboardTrendsRequest
{
    public string? TimeRange { get; set; } = "7days";
    public string? Region { get; set; } = "all";
}

public class GetAdminDashboardTrendsEndpoint : Endpoint<GetAdminDashboardTrendsRequest, ApiSuccessResponse<DashboardTrendsResponseDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/admin/dashboard/trends");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Lấy dữ liệu chuỗi thời gian (Time-series) biểu đồ xu hướng đánh giá & báo cáo";
            s.Description = "Hỗ trợ timeRange (today, 7days, 30days, 90days) và region (all, mien_bac, mien_trung, mien_nam).";
        });
    }

    public override async Task HandleAsync(GetAdminDashboardTrendsRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetAdminDashboardTrendsQuery(req.TimeRange, req.Region), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
