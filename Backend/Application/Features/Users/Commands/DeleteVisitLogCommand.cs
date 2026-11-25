using Application.Common;
using Application.Common.Interfaces;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Users.Commands;

public record DeleteVisitLogCommand(long Id, long UserId) : IRequest<Result>;

public class DeleteVisitLogCommandHandler : IRequestHandler<DeleteVisitLogCommand, Result>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IRecommendationService? _recommendationService;

    public DeleteVisitLogCommandHandler(IUnitOfWork unitOfWork, IRecommendationService? recommendationService = null)
    {
        _unitOfWork = unitOfWork;
        _recommendationService = recommendationService;
    }

    public async Task<Result> Handle(DeleteVisitLogCommand request, CancellationToken ct)
    {
        var log = await _unitOfWork.VisitLogs.GetByIdAsync(request.Id, ct);
        if (log == null)
        {
            log = await _unitOfWork.VisitLogs.GetByUserAndPlaceAsync(request.UserId, request.Id, ct);
        }

        if (log == null)
        {
            return Result.NotFound("Không tìm thấy bản ghi nhật ký.");
        }

        if (log.UserId != request.UserId)
        {
            return Result.Forbidden("Bạn không có quyền xóa nhật ký này.");
        }

        var allLogsForPlace = await _unitOfWork.VisitLogs.GetAllByUserAndPlaceAsync(request.UserId, log.PlaceId, ct);
        if (allLogsForPlace.Count > 0)
        {
            _unitOfWork.VisitLogs.RemoveRange(allLogsForPlace);
        }
        else
        {
            _unitOfWork.VisitLogs.Remove(log);
        }

        await _unitOfWork.SaveChangesAsync(ct);

        if (_recommendationService != null)
        {
            await _recommendationService.InvalidateUserVectorCacheAsync(request.UserId, ct);
        }

        return Result.Success("Đã xóa địa điểm khỏi nhật ký hành trình.");
    }
}
