using System.Globalization;
using Application.Common;
using Application.DTOs;
using Domain.Enums;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Trips.Commands;

public record UpdateTripPlaceCommand(long TripPlaceId, long UserId, UpdateTripPlaceRequestDto Dto) : IRequest<Result>;

public class UpdateTripPlaceCommandHandler : IRequestHandler<UpdateTripPlaceCommand, Result>
{
    private readonly IUnitOfWork _unitOfWork;

    public UpdateTripPlaceCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result> Handle(UpdateTripPlaceCommand request, CancellationToken ct)
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
                return Result.Forbidden("Bạn không có quyền chỉnh sửa điểm dừng này.");
            }
        }

        TimeOnly? startTime = ParseTime(request.Dto.StartTime);
        TimeOnly? endTime = ParseTime(request.Dto.EndTime);

        if (startTime.HasValue && endTime.HasValue && endTime < startTime)
        {
            return Result.Failure("Thời gian kết thúc không được trước thời gian bắt đầu.");
        }

        tripPlace.UpdateSchedule(
            request.Dto.VisitOrder > 0 ? request.Dto.VisitOrder : tripPlace.VisitOrder,
            startTime,
            endTime,
            request.Dto.EstimatedCost,
            request.Dto.TransportMode,
            request.Dto.Note);

        await _unitOfWork.SaveChangesAsync(ct);
        return Result.Success("Cập nhật điểm dừng thành công.");
    }

    private static TimeOnly? ParseTime(string? timeStr)
    {
        if (string.IsNullOrWhiteSpace(timeStr)) return null;
        if (TimeOnly.TryParseExact(timeStr.Trim(), ["HH:mm", "H:mm", "HH:mm:ss"], CultureInfo.InvariantCulture, DateTimeStyles.None, out var time))
            return time;
        return null;
    }
}
