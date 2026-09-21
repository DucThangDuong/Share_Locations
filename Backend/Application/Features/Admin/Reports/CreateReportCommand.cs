using Application.Common;
using Application.Common.Interfaces.Repositories;
using MediatR;

namespace Application.Features.Admin.Reports;

public record CreateReportCommand(
    string TargetType,
    long TargetId,
    int ReasonId,
    string? Description,
    long? ReporterId) : IRequest<Result<long>>;

public class CreateReportCommandHandler : IRequestHandler<CreateReportCommand, Result<long>>
{
    private readonly IAdminReportRepository _reportRepository;

    public CreateReportCommandHandler(IAdminReportRepository reportRepository)
    {
        _reportRepository = reportRepository;
    }

    public async Task<Result<long>> Handle(CreateReportCommand request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.TargetType))
        {
            return Result<long>.Failure("Loại đối tượng báo cáo không được để trống.");
        }

        if (request.TargetId <= 0)
        {
            return Result<long>.Failure("ID đối tượng báo cáo không hợp lệ.");
        }

        if (request.ReasonId <= 0)
        {
            return Result<long>.Failure("Vui lòng chọn lý do báo cáo hợp lệ.");
        }

        try
        {
            var reportId = await _reportRepository.CreateReportAsync(
                request.TargetType,
                request.TargetId,
                request.ReasonId,
                request.Description,
                request.ReporterId,
                ct);

            return Result<long>.Created(reportId, "Báo cáo của bạn đã được gửi thành công và đang được Ban kiểm duyệt xem xét.");
        }
        catch (ArgumentException ex)
        {
            return Result<long>.Failure(ex.Message);
        }
    }
}
