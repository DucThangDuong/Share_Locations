using Application.Common;
using Application.Common.Interfaces.Repositories;
using MediatR;

namespace Application.Features.Chat.Commands;

public record UpdateGroupRoomNameCommand(long RoomId, long RequesterId, string Name) : IRequest<Result<bool>>;

public class UpdateGroupRoomNameCommandHandler : IRequestHandler<UpdateGroupRoomNameCommand, Result<bool>>
{
    private readonly IChatRepository _chatRepository;

    public UpdateGroupRoomNameCommandHandler(IChatRepository chatRepository)
    {
        _chatRepository = chatRepository;
    }

    public async Task<Result<bool>> Handle(UpdateGroupRoomNameCommand request, CancellationToken ct)
    {
        var trimmedName = request.Name?.Trim();
        if (string.IsNullOrWhiteSpace(trimmedName))
        {
            return Result<bool>.Failure("Tên nhóm không được để trống.");
        }

        if (trimmedName.Length > 100)
        {
            return Result<bool>.Failure("Tên nhóm không được vượt quá 100 ký tự.");
        }

        var room = await _chatRepository.GetRoomByIdAsync(request.RoomId, ct);
        if (room == null)
        {
            return Result<bool>.NotFound("Phòng trò chuyện không tồn tại.");
        }

        if (!room.IsGroup)
        {
            return Result<bool>.Failure("Chỉ có thể đổi tên phòng chat nhóm.");
        }

        var isMember = await _chatRepository.IsUserInRoomAsync(request.RoomId, request.RequesterId, ct);
        if (!isMember)
        {
            return Result<bool>.Unauthorized("Bạn không phải thành viên của nhóm trò chuyện này.");
        }

        var updated = await _chatRepository.UpdateRoomNameAsync(request.RoomId, trimmedName, ct);
        if (!updated)
        {
            return Result<bool>.Failure("Đổi tên nhóm thất bại.");
        }

        return Result<bool>.Success(true, "Đổi tên nhóm thành công.");
    }
}
