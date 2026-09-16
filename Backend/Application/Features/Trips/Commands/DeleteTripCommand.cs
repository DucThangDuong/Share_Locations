using Application.Common;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Trips.Commands;

public record DeleteTripCommand(long TripId, long UserId) : IRequest<Result>;

public class DeleteTripCommandHandler : IRequestHandler<DeleteTripCommand, Result>
{
    private readonly IUnitOfWork _unitOfWork;

    public DeleteTripCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result> Handle(DeleteTripCommand request, CancellationToken ct)
    {
        var trip = await _unitOfWork.Trips.GetByIdAsync(request.TripId, ct);
        if (trip == null)
        {
            return Result.NotFound("Chuyến đi không tồn tại.");
        }

        // BOLA Check: CHỈ Owner mới được xóa trip
        if (trip.UserId != request.UserId)
        {
            return Result.Forbidden("Chỉ chủ sở hữu mới có quyền xóa chuyến đi.");
        }

        _unitOfWork.Trips.Remove(trip);
        await _unitOfWork.SaveChangesAsync(ct);

        return Result.Success("Đã xóa chuyến đi thành công.");
    }
}
