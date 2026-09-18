using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Chat.Commands;
using Domain.Enums;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http;

namespace API.Endpoints.Chat;

public class SendMessageRequest
{
    public long RoomId { get; set; }
    public string? Content { get; set; }
    public long? ReplyToMessageId { get; set; }

    // Chia sẻ thực thể du lịch (Địa điểm, Món ăn, Lịch trình)
    public long? PlaceId { get; set; }
    public long? FoodId { get; set; }
    public long? TripId { get; set; }

    // Tệp đa phương tiện đính kèm (ảnh, video, file)
    public List<IFormFile>? Files { get; set; }
}

public class SendMessageEndpoint : Endpoint<SendMessageRequest, ApiSuccessResponse<ChatMessageDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Post("/api/chat/rooms/{roomId}/messages");
        Tags("Chat");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        AllowFileUploads();
        Summary(s =>
        {
            s.Summary = "Gửi tin nhắn vào phòng trò chuyện";
            s.Description = "Gửi tin nhắn văn bản, kèm theo tệp đa phương tiện (ảnh/video) hoặc chia sẻ thực thể du lịch (Địa điểm, Món ăn, Lịch trình). Tự động phát sự kiện SignalR tới các thành viên trong phòng.";
        });
    }

    public override async Task HandleAsync(SendMessageRequest req, CancellationToken ct)
    {
        var userId = this.GetUserId();
        if (!userId.HasValue)
        {
            await this.SendApiResponseAsync(Result.Unauthorized("Bạn cần đăng nhập để gửi tin nhắn."), ct);
            return;
        }

        var attachments = new List<CreateAttachmentInput>();

        if (req.PlaceId.HasValue && req.PlaceId.Value > 0)
        {
            attachments.Add(new CreateAttachmentInput
            {
                AttachmentType = MessageAttachmentType.Place,
                PlaceId = req.PlaceId.Value
            });
        }

        if (req.FoodId.HasValue && req.FoodId.Value > 0)
        {
            attachments.Add(new CreateAttachmentInput
            {
                AttachmentType = MessageAttachmentType.Food,
                FoodId = req.FoodId.Value
            });
        }

        if (req.TripId.HasValue && req.TripId.Value > 0)
        {
            attachments.Add(new CreateAttachmentInput
            {
                AttachmentType = MessageAttachmentType.Trip,
                TripId = req.TripId.Value
            });
        }

        List<FileUploadModel>? fileUploads = null;
        if (req.Files != null && req.Files.Count > 0)
        {
            fileUploads = new List<FileUploadModel>();
            foreach (var file in req.Files)
            {
                if (file.Length > 0)
                {
                    fileUploads.Add(new FileUploadModel(
                        file.OpenReadStream(),
                        file.FileName,
                        file.ContentType));
                }
            }
        }

        var command = new SendMessageCommand(
            req.RoomId,
            userId.Value,
            req.Content,
            req.ReplyToMessageId,
            attachments.Count > 0 ? attachments : null,
            fileUploads);

        var result = await Mediator.Send(command, ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
