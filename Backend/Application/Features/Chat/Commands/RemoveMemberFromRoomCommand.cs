using Application.Common;
using Application.Common.Interfaces.Repositories;
using MediatR;

namespace Application.Features.Chat.Commands;

public record RemoveMemberFromRoomCommand(long RoomId, long RequesterId, long TargetUserId) : IRequest<Result<bool>>;

public class RemoveMemberFromRoomCommandHandler : IRequestHandler<RemoveMemberFromRoomCommand, Result<bool>>
{
    private readonly IChatRepository _chatRepository;

    public RemoveMemberFromRoomCommandHandler(IChatRepository chatRepository)
    {
        _chatRepository = chatRepository;
    }

    public async Task<Result<bool>> Handle(RemoveMemberFromRoomCommand request, CancellationToken ct)
    {
        if (request.TargetUserId <= 0)
        {
            return Result<bool>.Failure("ID thành viên cần xóa không hợp lệ.");
        }

        if (request.TargetUserId == request.RequesterId)
        {
            return Result<bool>.Failure("Quản trị viên không thể tự xóa mình khỏi nhóm. Hãy dùng chức năng Rời nhóm / Giải tán nhóm.");
        }

        var room = await _chatRepository.GetRoomByIdAsync(request.RoomId, ct);
        if (room == null)
        {
            return Result<bool>.NotFound("Phòng trò chuyện không tồn tại.");
        }

        if (!room.IsGroup)
        {
            return Result<bool>.Failure("Chỉ có thể xóa thành viên trong phòng chat nhóm.");
        }

        var members = await _chatRepository.GetRoomMembersAsync(request.RoomId, ct);
        if (members.Count == 0)
        {
            return Result<bool>.NotFound("Không tìm thấy danh sách thành viên nhóm.");
        }

        var requester = members.FirstOrDefault(m => m.UserId == request.RequesterId);
        bool isRequesterAdmin = requester != null && (requester.IsAdmin || requester.Role == "Admin");

        if (!isRequesterAdmin)
        {
            return Result<bool>.Forbidden("Chỉ có quản trị viên mới có quyền xóa thành viên khỏi nhóm.");
        }

        var isTargetMember = members.Any(m => m.UserId == request.TargetUserId);
        if (!isTargetMember)
        {
            return Result<bool>.NotFound("Thành viên này không thuộc nhóm trò chuyện.");
        }

        var removed = await _chatRepository.RemoveMemberFromRoomAsync(request.RoomId, request.TargetUserId, ct);
        if (!removed)
        {
            return Result<bool>.Failure("Xóa thành viên khỏi nhóm thất bại.");
        }

        return Result<bool>.Success(true, "Xóa thành viên khỏi nhóm thành công.");
    }
}
