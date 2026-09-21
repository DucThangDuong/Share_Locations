using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs.Admin;
using MediatR;

namespace Application.Features.Admin.Reports;

public record GetAdminGroupedReportsQuery : IRequest<Result<IReadOnlyList<GroupedReportDto>>>;

public class GetAdminGroupedReportsQueryHandler : IRequestHandler<GetAdminGroupedReportsQuery, Result<IReadOnlyList<GroupedReportDto>>>
{
    private readonly IAdminReportRepository _reportRepository;

    public GetAdminGroupedReportsQueryHandler(IAdminReportRepository reportRepository)
    {
        _reportRepository = reportRepository;
    }

    public async Task<Result<IReadOnlyList<GroupedReportDto>>> Handle(GetAdminGroupedReportsQuery request, CancellationToken ct)
    {
        var groups = await _reportRepository.GetGroupedReportsAsync(ct);
        return Result<IReadOnlyList<GroupedReportDto>>.Success(groups);
    }
}
