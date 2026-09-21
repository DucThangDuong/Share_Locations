using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs.Admin;
using MediatR;

namespace Application.Features.Admin.Reports;

public record GetMyReportsQuery(long UserId) : IRequest<Result<IReadOnlyList<ReportQueueItemDto>>>;

public class GetMyReportsQueryHandler : IRequestHandler<GetMyReportsQuery, Result<IReadOnlyList<ReportQueueItemDto>>>
{
    private readonly IAdminReportRepository _reportRepository;

    public GetMyReportsQueryHandler(IAdminReportRepository reportRepository)
    {
        _reportRepository = reportRepository;
    }

    public async Task<Result<IReadOnlyList<ReportQueueItemDto>>> Handle(GetMyReportsQuery request, CancellationToken ct)
    {
        var reports = await _reportRepository.GetMyReportsAsync(request.UserId, ct);
        return Result<IReadOnlyList<ReportQueueItemDto>>.Success(reports);
    }
}
