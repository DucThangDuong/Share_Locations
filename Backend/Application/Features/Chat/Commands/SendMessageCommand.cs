using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using Domain.Enums;
using MediatR;

namespace Application.Features.Chat.Commands;

public record SendMessageCommand(
    long RoomId,
    long SenderId,
    string? Content,
    long? ReplyToMessageId = null,
    IReadOnlyList<CreateAttachmentInput>? Attachments = null,
    IReadOnlyList<FileUploadModel>? Files = null) : IRequest<Result<ChatMessageDto>>;

public class SendMessageCommandHandler : IRequestHandler<SendMessageCommand, Result<ChatMessageDto>>
{
    private readonly IChatRepository _chatRepository;
    private readonly IChatNotifier _chatNotifier;
    private readonly IBlobService _blobService;

    public SendMessageCommandHandler(
        IChatRepository chatRepository,
        IChatNotifier chatNotifier,
        IBlobService blobService)
    {
        _chatRepository = chatRepository;
        _chatNotifier = chatNotifier;
        _blobService = blobService;
    }

    public async Task<Result<ChatMessageDto>> Handle(SendMessageCommand request, CancellationToken ct)
    {
        var isMember = await _chatRepository.IsUserInRoomAsync(request.RoomId, request.SenderId, ct);
        if (!isMember)
        {
            return Result<ChatMessageDto>.Forbidden("Bạn không có quyền gửi tin nhắn trong phòng trò chuyện này.");
        }

        var hasContent = !string.IsNullOrWhiteSpace(request.Content);
        var hasAttachments = request.Attachments != null && request.Attachments.Count > 0;
        var hasFiles = request.Files != null && request.Files.Count > 0;

        if (!hasContent && !hasAttachments && !hasFiles)
        {
            return Result<ChatMessageDto>.Failure("Nội dung tin nhắn hoặc tệp đính kèm không được để trống.");
        }

        var attachmentInputs = new List<CreateAttachmentInput>();
        if (request.Attachments != null)
        {
            attachmentInputs.AddRange(request.Attachments);
        }

        if (request.Files != null && request.Files.Count > 0)
        {
            foreach (var file in request.Files)
            {
                if (file.Content == null || file.Content.Length == 0) continue;

                var isVideo = file.ContentType.StartsWith("video/", StringComparison.OrdinalIgnoreCase);
                string mediaUrl;

                if (isVideo)
                {
                    mediaUrl = await _blobService.UploadVideoAsync(
                        file.Content,
                        file.FileName,
                        file.ContentType,
                        "chat-videos",
                        ct);

                    attachmentInputs.Add(new CreateAttachmentInput
                    {
                        AttachmentType = MessageAttachmentType.File,
                        MediaUrl = mediaUrl,
                        FileName = file.FileName,
                        FileSizeBytes = file.Content.Length
                    });
                }
                else
                {
                    mediaUrl = await _blobService.UploadImageAsync(
                        file.Content,
                        file.FileName,
                        file.ContentType,
                        "chat-images",
                        ct);

                    attachmentInputs.Add(new CreateAttachmentInput
                    {
                        AttachmentType = MessageAttachmentType.Image,
                        MediaUrl = mediaUrl,
                        FileName = file.FileName,
                        FileSizeBytes = file.Content.Length
                    });
                }
            }
        }

        var messageDto = await _chatRepository.SendMessageAsync(
            request.RoomId,
            request.SenderId,
            request.Content?.Trim(),
            request.ReplyToMessageId,
            attachmentInputs,
            ct);

        // Bắn thông báo thời gian thực qua SignalR
        await _chatNotifier.NotifyMessageReceivedAsync(request.RoomId, messageDto, ct);

        return Result<ChatMessageDto>.Success(messageDto);
    }
}
