using Application.Common;
using Application.Common.Interfaces.Repositories;
using MediatR;

namespace Application.Features.Chat.Commands;

public record AddMembersToRoomCommand(long RoomId, long RequesterId, IReadOnlyList<long> UserIds) : IRequest<Result<bool>>;

public class AddMembersToRoomCommandHandler : IRequestHandler<AddMembersToRoomCommand, Result<bool>>
{
    private readonly IChatRepository _chatRepository;

    public AddMembersToRoomCommandHandler(IChatRepository chatRepository)
    {
        _chatRepository = chatRepository;
    }

    public async Task<Result<bool>> Handle(AddMembersToRoomCommand request, CancellationToken ct)
    {
        var room = await _chatRepository.GetRoomByIdAsync(request.RoomId, ct);
        if (room == null)
        {
            return Result<bool>.NotFound("Phòng trò chuyện không tồn tại.");
        }

        if (!room.IsGroup)
        {
            return Result<bool>.Failure("Chỉ có thể thêm thành viên vào phòng chat nhóm.");
        }

        var isMember = await _chatRepository.IsUserInRoomAsync(request.RoomId, request.RequesterId, ct);
        if (!isMember)
        {
            return Result<bool>.Unauthorized("Bạn không phải thành viên của nhóm trò chuyện này.");
        }

        var validUserIds = request.UserIds?
            .Where(id => id > 0)
            .Distinct()
            .ToList() ?? new List<long>();

        if (validUserIds.Count == 0)
        {
            return Result<bool>.Failure("Danh sách thành viên cần thêm không hợp lệ.");
        }

        await _chatRepository.AddMembersToRoomAsync(request.RoomId, validUserIds, ct);
        return Result<bool>.Success(true, "Thêm thành viên vào nhóm thành công.");
    }
}