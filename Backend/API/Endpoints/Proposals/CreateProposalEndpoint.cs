using API.DTOs;
using API.DTOs.Proposals;
using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Proposals.Commands;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Proposals;

public class CreateProposalEndpoint : Endpoint<CreateProposalRequest, ApiSuccessResponse<UserProposalItemDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Post("/api/proposals");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Options(x => x.RequireRateLimiting("write_api"));
        Summary(s =>
        {
            s.Summary = "Gửi đề xuất địa điểm mới";
            s.Description = "Gửi đề xuất địa điểm mới. Bắt buộc phải có hình ảnh (hỗ trợ upload trực tiếp multipart/form-data hoặc chuỗi Base64 / URL). Hình ảnh sẽ được lưu trữ trên Azure Blob Storage và trả về đường dẫn URI.";
        });
    }

    public override async Task HandleAsync(CreateProposalRequest req, CancellationToken ct)
    {
        var userId = this.GetUserId();
        if (!userId.HasValue)
        {
            await this.SendApiResponseAsync(
                Result<UserProposalItemDto>.Unauthorized("Bạn cần đăng nhập để gửi đề xuất địa điểm."),
                ct);
            return;
        }

        var dto = new CreateProposalRequestDto
        {
            Name = req.Name,
            CategoryId = req.CategoryId,
            ProvinceId = req.ProvinceId,
            Address = req.Address,
            Phone = req.Phone,
            Website = req.Website,
            OpeningHours = req.OpeningHours,
            MinPrice = req.MinPrice,
            MaxPrice = req.MaxPrice,
            Latitude = req.Latitude,
            Longitude = req.Longitude,
            Description = req.Description,
            CoverImg = req.CoverImg,
            MediaUrls = (req.MediaUrls ?? req.Images ?? new List<string>()).Where(u => !string.IsNullOrWhiteSpace(u)).Distinct().ToList(),
            Images = (req.Images ?? req.MediaUrls ?? new List<string>()).Where(u => !string.IsNullOrWhiteSpace(u)).Distinct().ToList()
        };

        FileUploadModel? coverFile = null;
        var incomingCover = req.CoverImage ?? req.CoverImageFile;
        if (incomingCover == null && HttpContext.Request.HasFormContentType)
        {
            incomingCover = HttpContext.Request.Form.Files["coverImage"]
                         ?? HttpContext.Request.Form.Files["coverImg"]
                         ?? HttpContext.Request.Form.Files["coverFile"];
        }

        if (incomingCover != null && incomingCover.Length > 0)
        {
            coverFile = new FileUploadModel(
                incomingCover.OpenReadStream(),
                incomingCover.FileName,
                incomingCover.ContentType);
        }

        var mediaFiles = new List<FileUploadModel>();
        var incomingMedia = req.Photos ?? req.MediaFiles;
        if (incomingMedia != null)
        {
            foreach (var file in incomingMedia.Where(f => f.Length > 0))
            {
                mediaFiles.Add(new FileUploadModel(
                    file.OpenReadStream(),
                    file.FileName,
                    file.ContentType));
            }
        }

        if (HttpContext.Request.HasFormContentType)
        {
            var extraFiles = HttpContext.Request.Form.Files.GetFiles("photos");
            if (extraFiles.Count == 0) extraFiles = HttpContext.Request.Form.Files.GetFiles("images");
            if (extraFiles.Count == 0) extraFiles = HttpContext.Request.Form.Files.GetFiles("mediaFiles");

            foreach (var file in extraFiles)
            {
                if (file.Length > 0 && file != incomingCover && !mediaFiles.Any(m => m.FileName == file.FileName && m.Content.Length == file.Length))
                {
                    mediaFiles.Add(new FileUploadModel(
                        file.OpenReadStream(),
                        file.FileName,
                        file.ContentType));
                }
            }
        }

        var result = await Mediator.Send(new CreateProposalCommand(userId.Value, dto, coverFile, mediaFiles), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
