using Application.Common;
using Domain.Entities;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Places.Commands;

public record CreatePlaceReportCommand(
    long PlaceId,
    string Reason,
    string? Description = null,
    string? ContactEmail = null,
    long? ReporterId = null) : IRequest<Result<bool>>;

public class CreatePlaceReportCommandHandler : IRequestHandler<CreatePlaceReportCommand, Result<bool>>
{
    private readonly IUnitOfWork _unitOfWork;

    public CreatePlaceReportCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<bool>> Handle(CreatePlaceReportCommand request, CancellationToken ct)
    {
        var place = await _unitOfWork.Places.GetByIdAsync(request.PlaceId, ct);
        if (place == null)
        {
            return Result<bool>.NotFound("Địa điểm không tồn tại.");
        }

        var reportType = await _unitOfWork.ReportTypes.GetDefaultAsync(ct);
        var reportTypeId = reportType?.Id ?? 6;
        var reporterId = request.ReporterId ?? 1;

        var fullReason = !string.IsNullOrWhiteSpace(request.Description)
            ? $"{request.Reason} - Chi tiết: {request.Description}"
            : request.Reason;

        if (!string.IsNullOrWhiteSpace(request.ContactEmail))
        {
            fullReason += $" (Liên hệ: {request.ContactEmail.Trim()})";
        }

        var trimmedReason = fullReason.Length > 500 ? fullReason[..500] : fullReason;
        var report = new PlaceReport(reporterId, request.PlaceId, reportTypeId, trimmedReason);

        await _unitOfWork.PlaceReports.AddAsync(report, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        return Result<bool>.Success(true, "Cảm ơn bạn đã đóng góp thông tin. Báo cáo của bạn đang được xem xét.");
    }
}
