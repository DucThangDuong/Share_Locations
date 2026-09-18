using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using MediatR;

namespace Application.Features.Chat.Commands;

public record AddMessageReactionCommand(
    long RoomId,
    long MessageId,
    long UserId,
    string Emoji) : IRequest<Result>;

public class AddMessageReactionCommandHandler : IRequestHandler<AddMessageReactionCommand, Result>
{
    private readonly IChatRepository _chatRepository;
    private readonly IChatNotifier _chatNotifier;

    public AddMessageReactionCommandHandler(IChatRepository chatRepository, IChatNotifier chatNotifier)
    {
        _chatRepository = chatRepository;
        _chatNotifier = chatNotifier;
    }

    public async Task<Result> Handle(AddMessageReactionCommand request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Emoji))
        {
            return Result.Failure("Emoji không được để trống.");
        }

        var isMember = await _chatRepository.IsUserInRoomAsync(request.RoomId, request.UserId, ct);
        if (!isMember)
        {
            return Result.Forbidden("Bạn không có quyền tương tác trong phòng trò chuyện này.");
        }

        var success = await _chatRepository.AddReactionAsync(
            request.MessageId,
            request.UserId,
            request.Emoji.Trim(),
            ct);

        if (!success)
        {
            return Result.NotFound("Tin nhắn không tồn tại.");
        }

        await _chatNotifier.NotifyMessageReactedAsync(
            request.RoomId,
            request.MessageId,
            request.UserId,
            request.Emoji.Trim(),
            ct);

        return Result.Success("Đã cập nhật cảm xúc tin nhắn.");
    }
}
