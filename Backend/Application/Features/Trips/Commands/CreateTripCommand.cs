using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using Application.Common;
using Application.DTOs;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Trips.Commands;

public record CreateTripCommand(long UserId, CreateTripRequestDto Dto) : IRequest<Result<CreateTripResponseDto>>;

public class CreateTripCommandHandler : IRequestHandler<CreateTripCommand, Result<CreateTripResponseDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public CreateTripCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<CreateTripResponseDto>> Handle(CreateTripCommand request, CancellationToken ct)
    {
        var dto = request.Dto;
        if (string.IsNullOrWhiteSpace(dto.Title))
        {
            return Result<CreateTripResponseDto>.Failure("Tiêu đề chuyến đi không được để trống.");
        }

        if (dto.StartDate.HasValue && dto.EndDate.HasValue && dto.StartDate > dto.EndDate)
        {
            return Result<CreateTripResponseDto>.Failure("Ngày bắt đầu không được sau ngày kết thúc.");
        }

        Trip? sourceTrip = null;
        if (dto.SourceTripId.HasValue)
        {
            sourceTrip = await _unitOfWork.Trips.GetByIdWithDetailsAsync(dto.SourceTripId.Value, ct);
            if (sourceTrip == null)
            {
                return Result<CreateTripResponseDto>.NotFound("Lịch trình mẫu không tồn tại.");
            }

            if (sourceTrip.Privacy == TripPrivacy.Private && sourceTrip.UserId != request.UserId)
            {
                var isMember = sourceTrip.Members.Any(m => m.UserId == request.UserId);
                if (!isMember)
                {
                    return Result<CreateTripResponseDto>.Forbidden("Bạn không có quyền sao chép lịch trình riêng tư này.");
                }
            }
        }

        var privacy = Enum.IsDefined(typeof(TripPrivacy), dto.Privacy)
            ? (TripPrivacy)dto.Privacy
            : TripPrivacy.Private;

        long newTripId = 0;
        string tripTitle = dto.Title.Trim();
        int calculatedDurationDays = 1;
        decimal totalEstimatedBudget = 0;

        await _unitOfWork.ExecuteInTransactionAsync(async () =>
        {
            var trip = new Trip(
                request.UserId,
                tripTitle,
                dto.Description,
                privacy,
                dto.StartDate,
                dto.EndDate);

            if (!string.IsNullOrWhiteSpace(dto.CoverImageUrl))
            {
                trip.UpdateInfo(tripTitle, dto.Description, dto.CoverImageUrl.Trim());
            }

            await _unitOfWork.Trips.AddAsync(trip, ct);
            await _unitOfWork.SaveChangesAsync(ct);
            newTripId = trip.Id;

            var ownerMember = new TripMember(trip.Id, request.UserId, TripMemberRole.Owner);
            await _unitOfWork.Trips.AddMemberAsync(ownerMember, ct);

            if (sourceTrip != null)
            {
                foreach (var day in sourceTrip.Days.OrderBy(d => d.DayNumber))
                {
                    var newDay = new TripDay(trip.Id, day.DayNumber, day.DayTitle, day.Date);
                    await _unitOfWork.Trips.AddDayAsync(newDay, ct);
                    await _unitOfWork.SaveChangesAsync(ct);

                    foreach (var sp in day.Places.OrderBy(p => p.VisitOrder))
                    {
                        if (sp.EstimatedCost.HasValue)
                            totalEstimatedBudget += sp.EstimatedCost.Value;

                        var newPlace = new TripPlace(
                            newDay.Id,
                            sp.PlaceId,
                            sp.VisitOrder,
                            sp.StartTime,
                            sp.EndTime,
                            sp.EstimatedCost,
                            sp.TransportMode,
                            sp.Note);
                        await _unitOfWork.Trips.AddPlaceAsync(newPlace, ct);
                    }
                }
                calculatedDurationDays = sourceTrip.Days.Count > 0 ? sourceTrip.Days.Count : 1;
            }
            else if (dto.Days != null && dto.Days.Count > 0)
            {
                foreach (var day in dto.Days.OrderBy(d => d.DayNumber))
                {
                    var newDay = new TripDay(trip.Id, day.DayNumber, day.DayTitle, day.Date);
                    await _unitOfWork.Trips.AddDayAsync(newDay, ct);
                    await _unitOfWork.SaveChangesAsync(ct);

                    if (day.Stops != null && day.Stops.Count > 0)
                    {
                        foreach (var stop in day.Stops.OrderBy(s => s.VisitOrder))
                        {
                            TimeOnly? startTime = ParseTime(stop.StartTime);
                            TimeOnly? endTime = ParseTime(stop.EndTime);

                            if (stop.EstimatedCost.HasValue)
                                totalEstimatedBudget += stop.EstimatedCost.Value;

                            var newPlace = new TripPlace(
                                newDay.Id,
                                stop.PlaceId,
                                stop.VisitOrder,
                                startTime,
                                endTime,
                                stop.EstimatedCost,
                                stop.TransportMode,
                                stop.Note);
                            await _unitOfWork.Trips.AddPlaceAsync(newPlace, ct);
                        }
                    }
                }
                calculatedDurationDays = dto.Days.Count;
            }

            await _unitOfWork.SaveChangesAsync(ct);
        }, ct);

        if (dto.StartDate.HasValue && dto.EndDate.HasValue)
        {
            calculatedDurationDays = Math.Max(1, dto.EndDate.Value.DayNumber - dto.StartDate.Value.DayNumber + 1);
        }

        var slug = GenerateSlug(tripTitle, newTripId);
        var response = new CreateTripResponseDto
        {
            Id = newTripId,
            Title = tripTitle,
            Slug = slug,
            DurationDays = calculatedDurationDays,
            NightsCount = Math.Max(0, calculatedDurationDays - 1),
            EstimatedBudget = totalEstimatedBudget > 0 ? totalEstimatedBudget : null,
            CreatedAt = DateTime.UtcNow
        };

        return Result<CreateTripResponseDto>.Created(response, "Tạo chuyến đi thành công.");
    }

    private static TimeOnly? ParseTime(string? timeStr)
    {
        if (string.IsNullOrWhiteSpace(timeStr)) return null;
        if (TimeOnly.TryParseExact(timeStr.Trim(), ["HH:mm", "H:mm", "HH:mm:ss"], CultureInfo.InvariantCulture, DateTimeStyles.None, out var time))
            return time;
        return null;
    }

    private static string GenerateSlug(string title, long id)
    {
        string normalized = title.Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder();
        foreach (char c in normalized)
        {
            var uc = CharUnicodeInfo.GetUnicodeCategory(c);
            if (uc != UnicodeCategory.NonSpacingMark)
                sb.Append(c);
        }
        string clean = Regex.Replace(sb.ToString().Normalize(NormalizationForm.FormC).ToLowerInvariant(), @"[^a-z0-9\s-]", "");
        clean = Regex.Replace(clean, @"\s+", "-").Trim('-');
        return $"{clean}-{id}";
    }
}
