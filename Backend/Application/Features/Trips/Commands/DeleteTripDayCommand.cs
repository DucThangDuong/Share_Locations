using System.Text.RegularExpressions;
using Application.Common;
using Domain.Enums;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Trips.Commands;

public record DeleteTripDayCommand(long TripId, int DayNumber, long UserId) : IRequest<Result>;

public class DeleteTripDayCommandHandler : IRequestHandler<DeleteTripDayCommand, Result>
{
    private readonly IUnitOfWork _unitOfWork;

    public DeleteTripDayCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result> Handle(DeleteTripDayCommand request, CancellationToken ct)
    {
        var trip = await _unitOfWork.Trips.GetByIdAsync(request.TripId, ct);
        if (trip == null)
        {
            return Result.NotFound("Chuyến đi không tồn tại.");
        }

        bool isOwner = trip.UserId == request.UserId;
        if (!isOwner)
        {
            var member = await _unitOfWork.Trips.GetMemberAsync(request.TripId, request.UserId, ct);
            if (member == null || member.Role == TripMemberRole.Member)
            {
                return Result.Forbidden("Bạn không có quyền xóa ngày trong chuyến đi này.");
            }
        }

        var days = await _unitOfWork.Trips.GetDaysByTripIdAsync(request.TripId, ct);
        if (days.Count <= 1)
        {
            return Result.Failure("Chuyến đi cần tối thiểu 1 ngày.");
        }

        var targetDay = days.FirstOrDefault(d => d.DayNumber == request.DayNumber);
        if (targetDay == null)
        {
            return Result.NotFound($"Không tìm thấy Ngày {request.DayNumber} để xóa.");
        }

        bool hasTargetDate = targetDay.Date.HasValue;
        _unitOfWork.Trips.RemoveDay(targetDay);

        var remainingSubsequentDays = days
            .Where(d => d.DayNumber > request.DayNumber)
            .OrderBy(d => d.DayNumber)
            .ToList();

        foreach (var day in remainingSubsequentDays)
        {
            int oldNum = day.DayNumber;
            int newNum = oldNum - 1;
            day.UpdateDayNumber(newNum);

            if (!string.IsNullOrWhiteSpace(day.DayTitle))
            {
                string updatedTitle = Regex.Replace(day.DayTitle, @"^Ngày\s*\d+", $"Ngày {newNum}");
                day.UpdateTitle(updatedTitle);
            }

            if (hasTargetDate && day.Date.HasValue)
            {
                day.UpdateDate(day.Date.Value.AddDays(-1));
            }
        }

        await _unitOfWork.SaveChangesAsync(ct);
        return Result.Success("Đã xóa ngày khỏi lịch trình và cập nhật lại thứ tự các ngày.");
    }
}
