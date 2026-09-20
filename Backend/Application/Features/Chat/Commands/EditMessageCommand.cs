using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Chat.Commands;

public record EditMessageCommand(
    long MessageId,
    long CurrentUserId,
    string Content) : IRequest<Result<ChatMessageDto>>;

public class EditMessageCommandHandler : IRequestHandler<EditMessageCommand, Result<ChatMessageDto>>
{
    private readonly IChatRepository _chatRepository;
    private readonly IChatNotifier _chatNotifier;

    public EditMessageCommandHandler(IChatRepository chatRepository, IChatNotifier chatNotifier)
    {
        _chatRepository = chatRepository;
        _chatNotifier = chatNotifier;
    }

    public async Task<Result<ChatMessageDto>> Handle(EditMessageCommand request, CancellationToken ct)
    {
        var message = await _chatRepository.GetMessageByIdAsync(request.MessageId, ct);
        if (message == null)
        {
            return Result<ChatMessageDto>.NotFound("Tin nhắn không tồn tại.");
        }

        if (message.SenderId != request.CurrentUserId)
        {
            return Result<ChatMessageDto>.Forbidden("Bạn chỉ có thể chỉnh sửa tin nhắn của chính mình.");
        }

        var hasAttachments = message.Attachments != null && message.Attachments.Count > 0;
        if (string.IsNullOrWhiteSpace(request.Content) && !hasAttachments)
        {
            return Result<ChatMessageDto>.Failure("Nội dung tin nhắn không được để trống.");
        }

        var newContent = request.Content?.Trim() ?? string.Empty;

        var updated = await _chatRepository.UpdateMessageContentAsync(
            request.MessageId,
            request.CurrentUserId,
            newContent,
            ct);

        if (!updated)
        {
            return Result<ChatMessageDto>.Failure("Không thể cập nhật tin nhắn.");
        }

        var updatedMessage = await _chatRepository.GetMessageByIdAsync(request.MessageId, ct);
        if (updatedMessage != null)
        {
            await _chatNotifier.NotifyMessageEditedAsync(
                message.RoomId,
                request.MessageId,
                newContent,
                ct);

            return Result<ChatMessageDto>.Success(updatedMessage, "Chỉnh sửa tin nhắn thành công.");
        }

        return Result<ChatMessageDto>.Failure("Không thể lấy dữ liệu tin nhắn sau khi cập nhật.");
    }
}
