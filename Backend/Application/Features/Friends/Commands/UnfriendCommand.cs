using Application.Common;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Friends.Commands;

public record UnfriendCommand(long UserId, long TargetUserId) : IRequest<Result>;

public class UnfriendCommandHandler : IRequestHandler<UnfriendCommand, Result>
{
    private readonly IUnitOfWork _unitOfWork;

    public UnfriendCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result> Handle(UnfriendCommand request, CancellationToken ct)
    {
        var existing = await _unitOfWork.Friendships.GetFriendshipAsync(request.UserId, request.TargetUserId, ct);
        if (existing == null)
        {
            return Result.NotFound("Không tìm thấy mối quan hệ bạn bè hoặc lời mời.");
        }

        _unitOfWork.Friendships.Remove(existing);
        await _unitOfWork.SaveChangesAsync(ct);

        return Result.Success("Đã hủy kết bạn hoặc hủy lời mời thành công.");
    }
}
