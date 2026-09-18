using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using MediatR;

namespace Application.Features.Chat.Commands;

public record MarkRoomAsReadCommand(long RoomId, long UserId) : IRequest<Result>;

public class MarkRoomAsReadCommandHandler : IRequestHandler<MarkRoomAsReadCommand, Result>
{
    private readonly IChatRepository _chatRepository;
    private readonly IChatNotifier _chatNotifier;

    public MarkRoomAsReadCommandHandler(IChatRepository chatRepository, IChatNotifier chatNotifier)
    {
        _chatRepository = chatRepository;
        _chatNotifier = chatNotifier;
    }

    public async Task<Result> Handle(MarkRoomAsReadCommand request, CancellationToken ct)
    {
        var isMember = await _chatRepository.IsUserInRoomAsync(request.RoomId, request.UserId, ct);
        if (!isMember)
        {
            return Result.Forbidden("Bạn không phải thành viên của phòng trò chuyện này.");
        }

        var readAt = DateTime.UtcNow;
        var success = await _chatRepository.MarkRoomAsReadAsync(request.RoomId, request.UserId, ct);

        if (success)
        {
            await _chatNotifier.NotifyMessageReadAsync(request.RoomId, request.UserId, readAt, ct);
        }

        return Result.Success("Đã đánh dấu đã đọc tin nhắn.");
    }
}
