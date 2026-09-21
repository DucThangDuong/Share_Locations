using API.DTOs;
using API.Extensions;
using Application.DTOs.Admin;
using Application.Features.Admin.Reports;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Reports;

public class GetAdminGroupedReportsEndpoint : EndpointWithoutRequest<ApiSuccessResponse<IReadOnlyList<GroupedReportDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/admin/reports/grouped");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Lấy báo cáo gom nhóm theo đối tượng vi phạm (Admin)";
            s.Description = "Gom nhóm các báo cáo trùng lặp theo từng địa điểm, đánh giá, bình luận hoặc blog.";
        });
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetAdminGroupedReportsQuery(), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
