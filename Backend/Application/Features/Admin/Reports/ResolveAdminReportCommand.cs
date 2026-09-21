using Application.Common;
using Application.Common.Interfaces.Repositories;
using Domain.Enums;
using MediatR;

namespace Application.Features.Admin.Reports;

public record ResolveAdminReportCommand(
    string TargetType,
    long ReportId,
    long AdminId,
    string Decision, // "accept" | "dismiss"
    string? ActionTaken = null, // "hide_target" | "delete_permanently"
    string? ResolutionNote = null) : IRequest<Result<bool>>;

public class ResolveAdminReportCommandHandler : IRequestHandler<ResolveAdminReportCommand, Result<bool>>
{
    private readonly IAdminReportRepository _reportRepository;

    public ResolveAdminReportCommandHandler(IAdminReportRepository reportRepository)
    {
        _reportRepository = reportRepository;
    }

    public async Task<Result<bool>> Handle(ResolveAdminReportCommand request, CancellationToken ct)
    {
        var status = request.Decision.Equals("accept", StringComparison.OrdinalIgnoreCase)
            ? ReportStatus.Resolved
            : ReportStatus.Dismissed;

        var success = await _reportRepository.ResolveReportAsync(
            request.TargetType,
            request.ReportId,
            request.AdminId,
            status,
            request.ActionTaken,
            request.ResolutionNote,
            ct);

        if (!success)
        {
            return Result<bool>.NotFound("Không tìm thấy báo cáo hoặc loại đối tượng không hợp lệ.");
        }

        return Result<bool>.Success(true, "Đã xử lý báo cáo thành công.");
    }
}
