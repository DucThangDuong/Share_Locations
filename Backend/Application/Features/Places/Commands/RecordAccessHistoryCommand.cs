using Application.Common;
using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Places.Commands;

public record RecordAccessHistoryCommand(long PlaceId, long UserId) : IRequest<Result>;

public class RecordAccessHistoryCommandHandler : IRequestHandler<RecordAccessHistoryCommand, Result>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IRecommendationService? _recommendationService;

    public RecordAccessHistoryCommandHandler(IUnitOfWork unitOfWork, IRecommendationService? recommendationService = null)
    {
        _unitOfWork = unitOfWork;
        _recommendationService = recommendationService;
    }

    public async Task<Result> Handle(RecordAccessHistoryCommand request, CancellationToken ct)
    {
        var place = await _unitOfWork.Places.GetByIdAsync(request.PlaceId, ct);
        if (place == null || place.IsDeleted)
        {
            return Result.Failure("Địa điểm không tồn tại hoặc đã bị xóa.");
        }

        var existing = await _unitOfWork.AccessHistories.GetByUserAndPlaceAsync(request.UserId, request.PlaceId, ct);
        if (existing != null)
        {
            existing.UpdateViewedAt();
        }
        else
        {
            var history = new AccessHistory(request.UserId, request.PlaceId);
            await _unitOfWork.AccessHistories.AddAsync(history, ct);
        }

        await _unitOfWork.SaveChangesAsync(ct);

        if (_recommendationService != null)
        {
            await _recommendationService.InvalidateUserVectorCacheAsync(request.UserId, ct);
        }

        return Result.Success("Đã ghi nhận lịch sử truy cập.");
    }
}
