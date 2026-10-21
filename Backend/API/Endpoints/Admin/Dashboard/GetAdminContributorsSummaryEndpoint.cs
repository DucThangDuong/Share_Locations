using API.DTOs;
using API.Extensions;
using Application.DTOs.Admin;
using Application.Features.Admin.Dashboard;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Dashboard;

public class GetAdminContributorsSummaryEndpoint : EndpointWithoutRequest<ApiSuccessResponse<ContributorsSummaryDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/admin/dashboard/contributors-summary");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Lấy dữ liệu tóm tắt tăng trưởng thành viên đóng góp và phân bổ theo địa phương";
            s.Description = "Thống kê số lượng người đóng góp mới trong 30 ngày qua, tỷ lệ tăng trưởng so với tháng trước và top tỉnh thành tích cực nhất.";
        });
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetAdminContributorsSummaryQuery(), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
