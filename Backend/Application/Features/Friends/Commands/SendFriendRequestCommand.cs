using Application.Common;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Friends.Commands;

public record SendFriendRequestCommand(long UserId, long TargetUserId) : IRequest<Result>;

public class SendFriendRequestCommandHandler : IRequestHandler<SendFriendRequestCommand, Result>
{
    private readonly IUnitOfWork _unitOfWork;

    public SendFriendRequestCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result> Handle(SendFriendRequestCommand request, CancellationToken ct)
    {
        if (request.UserId == request.TargetUserId)
        {
            return Result.Failure("Không thể gửi lời mời kết bạn cho chính mình.");
        }

        var targetUser = await _unitOfWork.Users.GetByIdAsync(request.TargetUserId, ct);
        if (targetUser == null)
        {
            return Result.NotFound("Người dùng không tồn tại.");
        }

        var existing = await _unitOfWork.Friendships.GetFriendshipAsync(request.UserId, request.TargetUserId, ct);

        if (existing != null)
        {
            if (existing.Status == FriendshipStatus.Accepted)
            {
                return Result.Failure("Hai bạn đã là bạn bè.");
            }

            if (existing.Status == FriendshipStatus.Blocked)
            {
                return Result.Forbidden("Không thể gửi lời mời kết bạn tới người dùng này.");
            }

            if (existing.Status == FriendshipStatus.Pending)
            {
                if (existing.ActionUserId == request.UserId)
                {
                    return Result.Failure("Bạn đã gửi lời mời kết bạn trước đó rồi.");
                }

                // Đối phương đã gửi lời mời cho mình trước -> chấp nhận kết bạn ngay lập tức
                existing.Accept(request.UserId);
                await _unitOfWork.SaveChangesAsync(ct);
                return Result.Success("Hai bạn đã trở thành bạn bè!");
            }
        }

        var friendship = new Friendship(request.UserId, request.TargetUserId, request.UserId, FriendshipStatus.Pending);
        await _unitOfWork.Friendships.AddAsync(friendship, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        return Result.Success("Đã gửi lời mời kết bạn thành công.");
    }
}
