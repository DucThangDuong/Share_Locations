using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using MediatR;

namespace Application.Features.Chat.Commands;

public record DeleteMessageCommand(
    long MessageId,
    long CurrentUserId) : IRequest<Result<bool>>;

public class DeleteMessageCommandHandler : IRequestHandler<DeleteMessageCommand, Result<bool>>
{
    private readonly IChatRepository _chatRepository;
    private readonly IChatNotifier _chatNotifier;

    public DeleteMessageCommandHandler(IChatRepository chatRepository, IChatNotifier chatNotifier)
    {
        _chatRepository = chatRepository;
        _chatNotifier = chatNotifier;
    }

    public async Task<Result<bool>> Handle(DeleteMessageCommand request, CancellationToken ct)
    {
        var message = await _chatRepository.GetMessageByIdAsync(request.MessageId, ct);
        if (message == null)
        {
            return Result<bool>.NotFound("Tin nhắn không tồn tại.");
        }

        if (message.SenderId != request.CurrentUserId)
        {
            return Result<bool>.Forbidden("Bạn chỉ có thể xóa tin nhắn của chính mình.");
        }

        var deleted = await _chatRepository.DeleteMessageAsync(request.MessageId, request.CurrentUserId, ct);
        if (!deleted)
        {
            return Result<bool>.Failure("Không thể xóa tin nhắn.");
        }

        await _chatNotifier.NotifyMessageDeletedAsync(message.RoomId, request.MessageId, ct);

        return Result<bool>.Success(true, "Xóa tin nhắn thành công.");
    }
}
