using Application.Common;
using Application.DTOs;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Users.Commands;

public record CreateVisitLogCommand(
    long UserId,
    long PlaceId,
    string VisitedDate,
    int Privacy) : IRequest<Result<UserVisitLogItemDto>>;

public class CreateVisitLogCommandHandler : IRequestHandler<CreateVisitLogCommand, Result<UserVisitLogItemDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public CreateVisitLogCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<UserVisitLogItemDto>> Handle(CreateVisitLogCommand request, CancellationToken ct)
    {
        var place = await _unitOfWork.Places.GetByIdAsync(request.PlaceId, ct);
        if (place == null)
        {
            return Result<UserVisitLogItemDto>.NotFound("Địa điểm không tồn tại.");
        }

        if (!DateOnly.TryParse(request.VisitedDate, out var date))
        {
            date = DateOnly.FromDateTime(DateTime.UtcNow);
        }

        if (date > DateOnly.FromDateTime(DateTime.UtcNow))
        {
            return Result<UserVisitLogItemDto>.Failure("Ngày ghé thăm không được lớn hơn ngày hiện tại.");
        }

        var privacy = Enum.IsDefined(typeof(VisitPrivacy), (byte)request.Privacy)
            ? (VisitPrivacy)request.Privacy
            : VisitPrivacy.Public;

        var visitLog = new VisitLog(request.UserId, request.PlaceId, date, privacy);
        await _unitOfWork.VisitLogs.AddAsync(visitLog, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        var dto = new UserVisitLogItemDto
        {
            Id = visitLog.Id,
            PlaceId = place.Id,
            PlaceName = place.Name,
            Province = place.Province?.Name,
            Category = place.Category?.Name,
            VisitedDate = visitLog.VisitedDate.ToString("yyyy-MM-dd"),
            Privacy = (int)visitLog.Privacy,
            CoverImg = place.CoverImageUrl,
            Lat = place.Latitude != null ? (double)place.Latitude : null,
            Lng = place.Longitude != null ? (double)place.Longitude : null,
            CreatedAt = visitLog.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        };

        return Result<UserVisitLogItemDto>.Created(dto, "Đã thêm địa điểm vào nhật ký hành trình.");
    }
}
