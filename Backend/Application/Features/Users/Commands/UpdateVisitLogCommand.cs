using Application.Common;
using Domain.Enums;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Users.Commands;

public record UpdateVisitLogCommand(
    long Id,
    long UserId,
    string VisitedDate,
    int Privacy) : IRequest<Result>;

public class UpdateVisitLogCommandHandler : IRequestHandler<UpdateVisitLogCommand, Result>
{
    private readonly IUnitOfWork _unitOfWork;

    public UpdateVisitLogCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result> Handle(UpdateVisitLogCommand request, CancellationToken ct)
    {
        var log = await _unitOfWork.VisitLogs.GetByIdAsync(request.Id, ct);
        if (log == null)
        {
            return Result.NotFound("Không tìm thấy bản ghi nhật ký.");
        }

        if (log.UserId != request.UserId)
        {
            return Result.Forbidden("Bạn không có quyền chỉnh sửa nhật ký này.");
        }

        if (!DateOnly.TryParse(request.VisitedDate, out var date))
        {
            date = log.VisitedDate;
        }

        if (date > DateOnly.FromDateTime(DateTime.UtcNow))
        {
            return Result.Failure("Ngày ghé thăm không được lớn hơn ngày hiện tại.");
        }

        var privacy = Enum.IsDefined(typeof(VisitPrivacy), (byte)request.Privacy)
            ? (VisitPrivacy)request.Privacy
            : log.Privacy;

        log.Update(date, privacy);
        await _unitOfWork.SaveChangesAsync(ct);

        return Result.Success("Cập nhật nhật ký hành trình thành công.");
    }
}
