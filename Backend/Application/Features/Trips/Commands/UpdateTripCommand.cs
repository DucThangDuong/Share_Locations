using Application.Common;
using Application.DTOs;
using Domain.Enums;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Trips.Commands;

public record UpdateTripCommand(long TripId, long UserId, UpdateTripRequestDto Dto) : IRequest<Result>;

public class UpdateTripCommandHandler : IRequestHandler<UpdateTripCommand, Result>
{
    private readonly IUnitOfWork _unitOfWork;

    public UpdateTripCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result> Handle(UpdateTripCommand request, CancellationToken ct)
    {
        var trip = await _unitOfWork.Trips.GetByIdAsync(request.TripId, ct);
        if (trip == null)
        {
            return Result.NotFound("Chuyến đi không tồn tại.");
        }

        // BOLA Check: Phải là Owner hoặc Editor
        bool isOwner = trip.UserId == request.UserId;
        TripMember? member = null;
        if (!isOwner)
        {
            member = await _unitOfWork.Trips.GetMemberAsync(request.TripId, request.UserId, ct);
            if (member == null || member.Role == TripMemberRole.Member)
            {
                return Result.Forbidden("Bạn không có quyền chỉnh sửa chuyến đi này.");
            }
        }

        var dto = request.Dto;

        if (string.IsNullOrWhiteSpace(dto.Title))
        {
            return Result.Failure("Tiêu đề chuyến đi không được để trống.");
        }

        if (dto.StartDate.HasValue && dto.EndDate.HasValue && dto.StartDate > dto.EndDate)
        {
            return Result.Failure("Ngày bắt đầu không được sau ngày kết thúc.");
        }

        trip.UpdateInfo(dto.Title.Trim(), dto.Description?.Trim(), dto.CoverImageUrl?.Trim());
        trip.UpdateDates(dto.StartDate, dto.EndDate);

        // Chỉ Owner mới được đổi Privacy
        if (dto.Privacy.HasValue)
        {
            if (!isOwner)
            {
                return Result.Forbidden("Chỉ chủ sở hữu chuyến đi mới có quyền thay đổi chế độ riêng tư.");
            }

            if (Enum.IsDefined(typeof(TripPrivacy), dto.Privacy.Value))
            {
                trip.ChangePrivacy((TripPrivacy)dto.Privacy.Value);
            }
        }

        await _unitOfWork.SaveChangesAsync(ct);
        return Result.Success("Cập nhật thông tin chuyến đi thành công.");
    }
}
