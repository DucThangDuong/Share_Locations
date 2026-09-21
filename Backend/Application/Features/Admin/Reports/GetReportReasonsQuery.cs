using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs.Admin;
using MediatR;

namespace Application.Features.Admin.Reports;

public record GetReportReasonsQuery(string? TargetType = null) : IRequest<Result<IReadOnlyList<ReportReasonDto>>>;

public class GetReportReasonsQueryHandler : IRequestHandler<GetReportReasonsQuery, Result<IReadOnlyList<ReportReasonDto>>>
{
    private readonly IAdminReportRepository _reportRepository;

    public GetReportReasonsQueryHandler(IAdminReportRepository reportRepository)
    {
        _reportRepository = reportRepository;
    }

    public async Task<Result<IReadOnlyList<ReportReasonDto>>> Handle(GetReportReasonsQuery request, CancellationToken ct)
    {
        var reasons = await _reportRepository.GetReportReasonsAsync(request.TargetType, ct);
        return Result<IReadOnlyList<ReportReasonDto>>.Success(reasons);
    }
}
