using Application.Common;
using Domain.Enums;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Friends.Commands;

public record RespondFriendRequestCommand(long UserId, long TargetUserId, string Action) : IRequest<Result>;

public class RespondFriendRequestCommandHandler : IRequestHandler<RespondFriendRequestCommand, Result>
{
    private readonly IUnitOfWork _unitOfWork;

    public RespondFriendRequestCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result> Handle(RespondFriendRequestCommand request, CancellationToken ct)
    {
        var existing = await _unitOfWork.Friendships.GetFriendshipAsync(request.UserId, request.TargetUserId, ct);
        if (existing == null || existing.Status != FriendshipStatus.Pending)
        {
            return Result.NotFound("Không tìm thấy lời mời kết bạn đang chờ xử lý.");
        }

        // BOLA Check: Chỉ người nhận lời mời mới có quyền phản hồi
        if (existing.ActionUserId == request.UserId)
        {
            return Result.Forbidden("Bạn không thể tự phản hồi lời mời do chính mình gửi.");
        }

        var action = request.Action?.Trim().ToLowerInvariant();
        if (action == "accept")
        {
            existing.Accept(request.UserId);
            await _unitOfWork.SaveChangesAsync(ct);
            return Result.Success("Đã chấp nhận lời mời kết bạn.");
        }
        else if (action == "reject")
        {
            _unitOfWork.Friendships.Remove(existing);
            await _unitOfWork.SaveChangesAsync(ct);
            return Result.Success("Đã từ chối lời mời kết bạn.");
        }

        return Result.Failure("Hành động không hợp lệ. Chỉ chấp nhận 'accept' hoặc 'reject'.");
    }
}
