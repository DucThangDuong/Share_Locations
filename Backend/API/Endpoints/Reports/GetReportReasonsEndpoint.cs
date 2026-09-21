using API.DTOs;
using API.Extensions;
using Application.DTOs.Admin;
using Application.Features.Admin.Reports;
using FastEndpoints;
using MediatR;

namespace API.Endpoints.Reports;

public class GetReportReasonsRequest
{
    public string? TargetType { get; set; }
}

public class GetReportReasonsEndpoint : Endpoint<GetReportReasonsRequest, ApiSuccessResponse<IReadOnlyList<ReportReasonDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/reports/reasons");
        AllowAnonymous();
        Summary(s =>
        {
            s.Summary = "Lấy danh mục lý do báo cáo vi phạm";
            s.Description = "Trả về danh sách lý do báo cáo chuẩn hóa cho từng loại đối tượng (place, review, comment, blog).";
        });
    }

    public override async Task HandleAsync(GetReportReasonsRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetReportReasonsQuery(req.TargetType), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
