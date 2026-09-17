using Application.Common;
using Application.DTOs;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Trips.Commands;

public record AddTripDayCommand(
    long TripId,
    long UserId,
    AddTripDayRequestDto? Dto = null
) : IRequest<Result<TripDayDetailDto>>;

public class AddTripDayCommandHandler : IRequestHandler<AddTripDayCommand, Result<TripDayDetailDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public AddTripDayCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<TripDayDetailDto>> Handle(AddTripDayCommand request, CancellationToken ct)
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
                return Result<TripDayDetailDto>.Forbidden("Bạn không có quyền thêm ngày vào chuyến đi này.");
            }
        }

        var days = await _unitOfWork.Trips.GetDaysByTripIdAsync(request.TripId, ct);
        int nextDayNumber = (days.Count > 0 ? days.Max(d => d.DayNumber) : 0) + 1;

        var lastDay = days.OrderBy(d => d.DayNumber).LastOrDefault();
        DateOnly? calculatedDate = request.Dto?.Date;
        if (!calculatedDate.HasValue)
        {
            if (lastDay?.Date != null)
            {
                calculatedDate = lastDay.Date.Value.AddDays(1);
            }
            else if (trip.StartDate.HasValue)
            {
                calculatedDate = trip.StartDate.Value.AddDays(nextDayNumber - 1);
            }
        }

        string dayTitle = !string.IsNullOrWhiteSpace(request.Dto?.DayTitle)
            ? request.Dto.DayTitle.Trim()
            : $"Ngày {nextDayNumber}: Tiếp tục hành trình";

        var newDay = new TripDay(trip.Id, nextDayNumber, dayTitle, calculatedDate);
        await _unitOfWork.Trips.AddDayAsync(newDay, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        var resultDto = new TripDayDetailDto
        {
            Id = newDay.Id,
            DayNumber = newDay.DayNumber,
            DayTitle = newDay.DayTitle,
            Date = newDay.Date.HasValue ? newDay.Date.Value.ToString("yyyy-MM-dd") : null,
            Stops = new List<TripPlaceDetailDto>()
        };

        return Result<TripDayDetailDto>.Created(resultDto, "Thêm ngày mới thành công.");
    }
}
