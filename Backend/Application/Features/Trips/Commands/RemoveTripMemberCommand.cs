using Application.Common;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Trips.Commands;

public record RemoveTripMemberCommand(long TripId, long TargetUserId, long CurrentUserId) : IRequest<Result>;

public class RemoveTripMemberCommandHandler : IRequestHandler<RemoveTripMemberCommand, Result>
{
    private readonly IUnitOfWork _unitOfWork;

    public RemoveTripMemberCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result> Handle(RemoveTripMemberCommand request, CancellationToken ct)
    {
        var trip = await _unitOfWork.Trips.GetByIdAsync(request.TripId, ct);
        if (trip == null)
        {
            return Result.NotFound("Chuyến đi không tồn tại.");
        }

        if (request.TargetUserId == trip.UserId)
        {
            return Result.Failure("Không thể gỡ bỏ chủ sở hữu khỏi chuyến đi.");
        }

        // BOLA Check: Chỉ Owner được đuổi người, hoặc chính người đó tự rút lui
        bool isOwner = trip.UserId == request.CurrentUserId;
        bool isSelf = request.TargetUserId == request.CurrentUserId;

        if (!isOwner && !isSelf)
        {
            return Result.Forbidden("Bạn không có quyền gỡ thành viên này khỏi chuyến đi.");
        }

        var member = await _unitOfWork.Trips.GetMemberAsync(request.TripId, request.TargetUserId, ct);
        if (member == null)
        {
            return Result.NotFound("Thành viên không tham gia chuyến đi này.");
        }

        _unitOfWork.Trips.RemoveMember(member);
        await _unitOfWork.SaveChangesAsync(ct);

        var msg = isSelf ? "Bạn đã rời khỏi chuyến đi." : "Đã xóa thành viên khỏi chuyến đi.";
        return Result.Success(msg);
    }
}
