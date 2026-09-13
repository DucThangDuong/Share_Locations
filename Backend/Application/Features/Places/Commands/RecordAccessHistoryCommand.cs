using Application.Common;
using Domain.Entities;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Places.Commands;

public record RecordAccessHistoryCommand(long PlaceId, long UserId) : IRequest<Result>;

public class RecordAccessHistoryCommandHandler : IRequestHandler<RecordAccessHistoryCommand, Result>
{
    private readonly IUnitOfWork _unitOfWork;

    public RecordAccessHistoryCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result> Handle(RecordAccessHistoryCommand request, CancellationToken ct)
    {
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
        return Result.Success("Đã ghi nhận lịch sử truy cập.");
    }
}
