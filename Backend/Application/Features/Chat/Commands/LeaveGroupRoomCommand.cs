using Application.Common;
using Application.Common.Interfaces.Repositories;
using MediatR;

namespace Application.Features.Chat.Commands;

public record LeaveGroupRoomCommand(long RoomId, long UserId) : IRequest<Result<bool>>;

public class LeaveGroupRoomCommandHandler : IRequestHandler<LeaveGroupRoomCommand, Result<bool>>
{
    private readonly IChatRepository _chatRepository;

    public LeaveGroupRoomCommandHandler(IChatRepository chatRepository)
    {
        _chatRepository = chatRepository;
    }

    public async Task<Result<bool>> Handle(LeaveGroupRoomCommand request, CancellationToken ct)
    {
        var room = await _chatRepository.GetRoomByIdAsync(request.RoomId, ct);
        if (room == null)
        {
            return Result<bool>.NotFound("Phòng trò chuyện không tồn tại.");
        }

        if (!room.IsGroup)
        {
            return Result<bool>.Failure("Chỉ có thể rời khỏi phòng chat nhóm.");
        }

        var isMember = await _chatRepository.IsUserInRoomAsync(request.RoomId, request.UserId, ct);
        if (!isMember)
        {
            return Result<bool>.Forbidden("Bạn không phải thành viên của nhóm trò chuyện này.");
        }

        var members = await _chatRepository.GetRoomMembersAsync(request.RoomId, ct);
        if (members.Count == 0)
        {
            return Result<bool>.Failure("Nhóm không có thành viên.");
        }

        var currentMember = members.FirstOrDefault(m => m.UserId == request.UserId);
        bool isRequesterAdmin = currentMember != null && (currentMember.IsAdmin || currentMember.Role == "Admin");

        if (isRequesterAdmin)
        {
            // Quản trị viên rời nhóm -> xóa tất cả thành viên khỏi nhóm (giải tán nhóm)
            await _chatRepository.DisbandGroupRoomAsync(request.RoomId, ct);
            return Result<bool>.Success(true, "Quản trị viên đã rời nhóm. Toàn bộ thành viên đã được xóa và nhóm đã được giải tán.");
        }
        else
        {
            // Thành viên bình thường rời nhóm
            await _chatRepository.RemoveMemberFromRoomAsync(request.RoomId, request.UserId, ct);
            return Result<bool>.Success(true, "Bạn đã rời khỏi nhóm trò chuyện thành công.");
        }
    }
}
