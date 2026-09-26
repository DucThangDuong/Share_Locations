using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Trips.Commands;
using FastEndpoints;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http;

namespace API.Endpoints.Trips;

public class PublishTripRequest
{
    [BindFrom("id")]
    public long Id { get; set; }

    public string Description { get; set; } = string.Empty;
    public string? Title { get; set; }
    public IFormFile? CoverImageFile { get; set; }
}

public class PublishTripRequestValidator : AbstractValidator<PublishTripRequest>
{
    private static readonly string[] AllowedExtensions = { ".jpg", ".jpeg", ".png", ".webp" };
    private static readonly string[] AllowedMimeTypes = { "image/jpeg", "image/png", "image/webp" };
    private const long MaxFileSize = 5 * 1024 * 1024; // 5MB

    public PublishTripRequestValidator()
    {
        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("Mô tả chuyến đi là bắt buộc khi xuất bản.")
            .MinimumLength(10).WithMessage("Mô tả chuyến đi phải có ít nhất 10 ký tự.")
            .MaximumLength(2000).WithMessage("Mô tả chuyến đi không được vượt quá 2000 ký tự.");

        RuleFor(x => x.Title)
            .MaximumLength(255).WithMessage("Tiêu đề không được vượt quá 255 ký tự.");

        RuleFor(x => x.CoverImageFile)
            .Must(f => f == null || f.Length <= MaxFileSize)
            .WithMessage("Kích thước ảnh bìa không được vượt quá 5MB.")
            .Must(f =>
            {
                if (f == null) return true;
                var ext = Path.GetExtension(f.FileName).ToLowerInvariant();
                return AllowedExtensions.Contains(ext) && AllowedMimeTypes.Contains(f.ContentType.ToLowerInvariant());
            })
            .WithMessage("Ảnh bìa phải có định dạng hợp lệ (JPG, JPEG, PNG, WEBP).");
    }
}

public class PublishTripEndpoint : Endpoint<PublishTripRequest, ApiSuccessResponse<object>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Post("/api/trips/{id}/publish");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        AllowFileUploads();
        Options(x => x.RequireRateLimiting("write_api"));
        Summary(s =>
        {
            s.Summary = "Xuất bản chuyến đi công khai";
            s.Description = "Xuất bản chuyến đi lên cộng đồng để mọi người có thể xem và khám phá. Yêu cầu bắt buộc phải có mô tả chuyến đi (description), người dùng tải tệp ảnh bìa (coverImageFile) lên để lưu vào Azure Blob Storage. Chỉ có chủ sở hữu (Owner) mới có quyền thực hiện.";
        });
    }

    public override async Task HandleAsync(PublishTripRequest req, CancellationToken ct)
    {
        var userId = this.GetUserId();
        if (!userId.HasValue)
        {
            await this.SendApiResponseAsync(
                Result.Unauthorized("Bạn cần đăng nhập để xuất bản chuyến đi."),
                ct);
            return;
        }

        var dto = new PublishTripRequestDto
        {
            Description = req.Description,
            Title = req.Title
        };

        FileUploadModel? coverFileUpload = null;
        if (req.CoverImageFile != null && req.CoverImageFile.Length > 0)
        {
            coverFileUpload = new FileUploadModel(
                req.CoverImageFile.OpenReadStream(),
                req.CoverImageFile.FileName,
                req.CoverImageFile.ContentType);
        }

        var result = await Mediator.Send(new PublishTripCommand(req.Id, userId.Value, dto, coverFileUpload), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}


