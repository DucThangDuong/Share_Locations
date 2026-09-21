using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs.Admin;
using MediatR;

namespace Application.Features.Admin.Reports;

public record GetAdminReportsQueueQuery(
    string? SubTab = null,
    string? TargetType = null,
    int? Status = null,
    string? Keyword = null,
    int Page = 1,
    int PageSize = 10) : IRequest<Result<PagedResult<ReportQueueItemDto>>>;

public class GetAdminReportsQueueQueryHandler : IRequestHandler<GetAdminReportsQueueQuery, Result<PagedResult<ReportQueueItemDto>>>
{
    private readonly IAdminReportRepository _reportRepository;

    public GetAdminReportsQueueQueryHandler(IAdminReportRepository reportRepository)
    {
        _reportRepository = reportRepository;
    }

    public async Task<Result<PagedResult<ReportQueueItemDto>>> Handle(GetAdminReportsQueueQuery request, CancellationToken ct)
    {
        var page = request.Page > 0 ? request.Page : 1;
        var pageSize = request.PageSize > 0 ? request.PageSize : 10;

        var result = await _reportRepository.GetReportsQueueAsync(
            request.SubTab,
            request.TargetType,
            request.Status,
            request.Keyword,
            page,
            pageSize,
            ct);

        return Result<PagedResult<ReportQueueItemDto>>.Success(result);
    }
}
