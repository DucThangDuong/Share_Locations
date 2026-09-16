using Application.Common;
using Application.DTOs;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Trips.Commands;

public record InviteTripMemberCommand(long TripId, long OwnerUserId, InviteTripMemberRequestDto Dto) : IRequest<Result>;

public class InviteTripMemberCommandHandler : IRequestHandler<InviteTripMemberCommand, Result>
{
    private readonly IUnitOfWork _unitOfWork;

    public InviteTripMemberCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result> Handle(InviteTripMemberCommand request, CancellationToken ct)
    {
        var trip = await _unitOfWork.Trips.GetByIdAsync(request.TripId, ct);
        if (trip == null)
        {
            return Result.NotFound("Chuyến đi không tồn tại.");
        }

        // BOLA Check: CHỈ Owner mới được mời thành viên mới
        if (trip.UserId != request.OwnerUserId)
        {
            return Result.Forbidden("Chỉ chủ sở hữu mới có quyền mời thành viên vào chuyến đi.");
        }

        if (string.IsNullOrWhiteSpace(request.Dto.Email))
        {
            return Result.Failure("Email người nhận không được để trống.");
        }

        var targetUser = await _unitOfWork.Users.GetByEmailAsync(request.Dto.Email.Trim(), ct);
        if (targetUser == null)
        {
            return Result.NotFound("Không tìm thấy người dùng với địa chỉ email này.");
        }

        if (targetUser.Id == trip.UserId)
        {
            return Result.Failure("Người dùng này là chủ sở hữu của chuyến đi.");
        }

        var existingMember = await _unitOfWork.Trips.GetMemberAsync(trip.Id, targetUser.Id, ct);
        if (existingMember != null)
        {
            return Result.Conflict("Người dùng này đã tham gia chuyến đi.");
        }

        var role = request.Dto.Role.Equals("Editor", StringComparison.OrdinalIgnoreCase)
            ? TripMemberRole.Editor
            : TripMemberRole.Member;

        var member = new TripMember(trip.Id, targetUser.Id, role);
        await _unitOfWork.Trips.AddMemberAsync(member, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        return Result.Success("Đã thêm thành viên vào chuyến đi thành công.");
    }
}
