using Application.Common;
using Application.DTOs;
using Domain.Enums;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Trips.Commands;

public record UpdateTripDayCommand(
    long TripId,
    int DayNumber,
    long UserId,
    UpdateTripDayRequestDto Dto
) : IRequest<Result<TripDayDetailDto>>;

public class UpdateTripDayCommandHandler : IRequestHandler<UpdateTripDayCommand, Result<TripDayDetailDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public UpdateTripDayCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<TripDayDetailDto>> Handle(UpdateTripDayCommand request, CancellationToken ct)
    {
        var trip = await _unitOfWork.Trips.GetByIdAsync(request.TripId, ct);
        if (trip == null)
        {
            return Result<TripDayDetailDto>.NotFound("Chuyến đi không tồn tại.");
        }

        bool isOwner = trip.UserId == request.UserId;
        if (!isOwner)
        {
            var member = await _unitOfWork.Trips.GetMemberAsync(request.TripId, request.UserId, ct);
            if (member == null || member.Role == TripMemberRole.Member)
            {
                return Result<TripDayDetailDto>.Forbidden("Bạn không có quyền chỉnh sửa ngày trong chuyến đi này.");
            }
        }

        var day = await _unitOfWork.Trips.GetDayByTripAndNumberAsync(request.TripId, request.DayNumber, ct);
        if (day == null)
        {
            return Result<TripDayDetailDto>.NotFound($"Không tìm thấy Ngày {request.DayNumber} trong chuyến đi.");
        }

        day.UpdateInfo(request.Dto.DayTitle, request.Dto.Date);
        await _unitOfWork.SaveChangesAsync(ct);

        var places = await _unitOfWork.Trips.GetPlacesByDayIdAsync(day.Id, ct);
        var stops = places.Select(p => new TripPlaceDetailDto
        {
            Id = p.Id,
            PlaceId = p.PlaceId,
            Name = p.Place?.Name ?? string.Empty,
            Category = null,
            Address = p.Place?.Address,
            Latitude = (double?)p.Place?.Latitude,
            Longitude = (double?)p.Place?.Longitude,
            VisitOrder = p.VisitOrder,
            StartTime = p.StartTime.HasValue ? p.StartTime.Value.ToString(@"hh\:mm") : null,
            EndTime = p.EndTime.HasValue ? p.EndTime.Value.ToString(@"hh\:mm") : null,
            EstimatedCost = p.EstimatedCost,
            TransportMode = p.TransportMode,
            Note = p.Note,
            ImageUrl = p.Place?.CoverImageUrl
        }).ToList();

        var resultDto = new TripDayDetailDto
        {
            Id = day.Id,
            DayNumber = day.DayNumber,
            DayTitle = day.DayTitle,
            Date = day.Date.HasValue ? day.Date.Value.ToString("yyyy-MM-dd") : null,
            Stops = stops
        };

        return Result<TripDayDetailDto>.Success(resultDto, "Cập nhật thông tin ngày thành công.");
    }
}
