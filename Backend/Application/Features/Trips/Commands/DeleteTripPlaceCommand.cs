using Application.Common;
using Domain.Enums;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Trips.Commands;

public record DeleteTripPlaceCommand(long TripPlaceId, long UserId) : IRequest<Result>;

public class DeleteTripPlaceCommandHandler : IRequestHandler<DeleteTripPlaceCommand, Result>
{
    private readonly IUnitOfWork _unitOfWork;

    public DeleteTripPlaceCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result> Handle(DeleteTripPlaceCommand request, CancellationToken ct)
    {
        var tripPlace = await _unitOfWork.Trips.GetPlaceWithDayAndTripByIdAsync(request.TripPlaceId, ct);
        if (tripPlace == null)
        {
            return Result.NotFound("Điểm dừng không tồn tại.");
        }

        var trip = tripPlace.TripDay?.Trip;
        if (trip == null)
        {
            return Result.NotFound("Chuyến đi không tồn tại.");
        }

        // BOLA Check: Owner hoặc Editor
        bool isOwner = trip.UserId == request.UserId;
        if (!isOwner)
        {
            var member = await _unitOfWork.Trips.GetMemberAsync(trip.Id, request.UserId, ct);
            if (member == null || member.Role == TripMemberRole.Member)
            {
                return Result.Forbidden("Bạn không có quyền xóa điểm dừng này.");
            }
        }

        long dayId = tripPlace.TripDayId;
        _unitOfWork.Trips.RemovePlace(tripPlace);
        await _unitOfWork.SaveChangesAsync(ct);

        // Re-index remaining places
        var remainingPlaces = await _unitOfWork.Trips.GetPlacesByDayIdAsync(dayId, ct);
        int order = 1;
        foreach (var sp in remainingPlaces)
        {
            sp.UpdateSchedule(order++, sp.StartTime, sp.EndTime, sp.EstimatedCost, sp.TransportMode, sp.Note);
        }
        await _unitOfWork.SaveChangesAsync(ct);

        return Result.Success("Đã xóa điểm dừng thành công.");
    }
}
