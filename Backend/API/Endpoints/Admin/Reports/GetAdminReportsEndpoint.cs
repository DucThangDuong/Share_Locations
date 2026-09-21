using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs.Admin;
using Application.Features.Admin.Reports;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Reports;

public class GetAdminReportsRequest
{
    public string? SubTab { get; set; }
    public string? TargetType { get; set; }
    public int? Status { get; set; }
    public string? Keyword { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public class GetAdminReportsEndpoint : Endpoint<GetAdminReportsRequest, ApiSuccessResponse<IReadOnlyList<ReportQueueItemDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/admin/reports");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Lấy hàng đợi báo cáo vi phạm (Admin/Moderator)";
            s.Description = "Lấy danh sách các báo cáo vi phạm có hỗ trợ lọc theo loại đối tượng, trạng thái, mức độ ưu tiên và từ khóa.";
        });
    }

    public override async Task HandleAsync(GetAdminReportsRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(
            new GetAdminReportsQueueQuery(
                req.SubTab,
                req.TargetType,
                req.Status,
                req.Keyword,
                req.Page,
                req.PageSize),
            ct);

        await this.SendPagedApiResponseAsync(result, ct);
    }
}
