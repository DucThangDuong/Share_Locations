using Application.Common;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Users.Commands;

public record DeleteVisitLogCommand(long Id, long UserId) : IRequest<Result>;

public class DeleteVisitLogCommandHandler : IRequestHandler<DeleteVisitLogCommand, Result>
{
    private readonly IUnitOfWork _unitOfWork;

    public DeleteVisitLogCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result> Handle(DeleteVisitLogCommand request, CancellationToken ct)
    {
        var log = await _unitOfWork.VisitLogs.GetByIdAsync(request.Id, ct);
        if (log == null)
        {
            return Result.NotFound("Không tìm thấy bản ghi nhật ký.");
        }

        if (log.UserId != request.UserId)
        {
            return Result.Forbidden("Bạn không có quyền xóa nhật ký này.");
        }

        _unitOfWork.VisitLogs.Remove(log);
        await _unitOfWork.SaveChangesAsync(ct);

        return Result.Success("Đã xóa địa điểm khỏi nhật ký hành trình.");
    }
}
