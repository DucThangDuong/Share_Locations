using System.Globalization;
using Application.Common;
using Application.DTOs;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Trips.Commands;

public record AddTripPlaceCommand(long TripId, int DayNumber, long UserId, AddTripPlaceRequestDto Dto) : IRequest<Result<TripPlaceDetailDto>>;

public class AddTripPlaceCommandHandler : IRequestHandler<AddTripPlaceCommand, Result<TripPlaceDetailDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public AddTripPlaceCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<TripPlaceDetailDto>> Handle(AddTripPlaceCommand request, CancellationToken ct)
    {
        var trip = await _unitOfWork.Trips.GetByIdAsync(request.TripId, ct);
        if (trip == null)
        {
            return Result<TripPlaceDetailDto>.NotFound("Chuyến đi không tồn tại.");
        }

        // BOLA Check: Owner hoặc Editor
        bool isOwner = trip.UserId == request.UserId;
        if (!isOwner)
        {
            var member = await _unitOfWork.Trips.GetMemberAsync(request.TripId, request.UserId, ct);
            if (member == null || member.Role == TripMemberRole.Member)
            {
                return Result<TripPlaceDetailDto>.Forbidden("Bạn không có quyền thêm điểm dừng vào chuyến đi này.");
            }
        }

        // Kiểm tra PlaceId tồn tại
        var place = await _unitOfWork.Places.GetByIdAsync(request.Dto.PlaceId, ct);
        if (place == null)
        {
            return Result<TripPlaceDetailDto>.NotFound("Địa điểm không tồn tại.");
        }

        // Lấy hoặc tạo mới TripDay
        var day = await _unitOfWork.Trips.GetDayByTripAndNumberAsync(request.TripId, request.DayNumber, ct);
        if (day == null)
        {
            day = new TripDay(request.TripId, request.DayNumber, $"Ngày {request.DayNumber}");
            await _unitOfWork.Trips.AddDayAsync(day, ct);
            await _unitOfWork.SaveChangesAsync(ct);
        }

        var existingPlaces = await _unitOfWork.Trips.GetPlacesByDayIdAsync(day.Id, ct);

        int visitOrder = request.Dto.VisitOrder;
        if (visitOrder <= 0)
        {
            visitOrder = existingPlaces.Count > 0 ? existingPlaces.Max(p => p.VisitOrder) + 1 : 1;
        }
        else
        {
            // Dời các stop có visitOrder >= vị trí cần chèn
            foreach (var sp in existingPlaces.Where(p => p.VisitOrder >= visitOrder))
            {
                sp.UpdateSchedule(sp.VisitOrder + 1, sp.StartTime, sp.EndTime, sp.EstimatedCost, sp.TransportMode, sp.Note);
            }
        }

        TimeOnly? startTime = ParseTime(request.Dto.StartTime);
        TimeOnly? endTime = ParseTime(request.Dto.EndTime);

        if (startTime.HasValue && endTime.HasValue && endTime < startTime)
        {
            return Result<TripPlaceDetailDto>.Failure("Thời gian kết thúc không được trước thời gian bắt đầu.");
        }

        var tripPlace = new TripPlace(
            day.Id,
            request.Dto.PlaceId,
            visitOrder,
            startTime,
            endTime,
            request.Dto.EstimatedCost,
            request.Dto.TransportMode,
            request.Dto.Note);

        await _unitOfWork.Trips.AddPlaceAsync(tripPlace, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        var resultDto = new TripPlaceDetailDto
        {
            Id = tripPlace.Id,
            PlaceId = place.Id,
            Name = place.Name,
            Category = null,
            Address = place.Address,
            Latitude = (double?)place.Latitude,
            Longitude = (double?)place.Longitude,
            VisitOrder = tripPlace.VisitOrder,
            StartTime = tripPlace.StartTime.HasValue ? tripPlace.StartTime.Value.ToString(@"hh\:mm") : null,
            EndTime = tripPlace.EndTime.HasValue ? tripPlace.EndTime.Value.ToString(@"hh\:mm") : null,
            EstimatedCost = tripPlace.EstimatedCost,
            TransportMode = tripPlace.TransportMode,
            Note = tripPlace.Note,
            ImageUrl = place.CoverImageUrl
        };

        return Result<TripPlaceDetailDto>.Created(resultDto, "Thêm điểm dừng thành công.");
    }

    private static TimeOnly? ParseTime(string? timeStr)
    {
        if (string.IsNullOrWhiteSpace(timeStr)) return null;
        if (TimeOnly.TryParseExact(timeStr.Trim(), ["HH:mm", "H:mm", "HH:mm:ss"], CultureInfo.InvariantCulture, DateTimeStyles.None, out var time))
            return time;
        return null;
    }
}
