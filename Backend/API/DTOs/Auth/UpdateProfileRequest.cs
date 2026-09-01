using FastEndpoints;
using FluentValidation;
using Microsoft.AspNetCore.Http;

namespace API.DTOs.Auth;

public class UpdateProfileRequest
{
    public string? FullName { get; set; }
    public string? Phone { get; set; }
    public string? Bio { get; set; }
    public IFormFile? AvatarFile { get; set; }
    public IFormFile? CoverFile { get; set; }
}

public class UpdateProfileRequestValidator : Validator<UpdateProfileRequest>
{
    private static readonly string[] AllowedExtensions = { ".jpg", ".jpeg", ".png", ".webp", ".gif" };
    private static readonly string[] AllowedMimeTypes = { "image/jpeg", "image/png", "image/webp", "image/gif" };
    private const long MaxFileSize = 5 * 1024 * 1024;

    public UpdateProfileRequestValidator()
    {
        RuleFor(x => x.FullName)
            .MinimumLength(2).WithMessage("Họ tên phải từ 2 ký tự trở lên")
            .MaximumLength(50).WithMessage("Họ tên không được vượt quá 50 ký tự")
            .When(x => !string.IsNullOrWhiteSpace(x.FullName));

        RuleFor(x => x.Phone)
            .MaximumLength(20).WithMessage("Số điện thoại không được vượt quá 20 ký tự")
            .Matches(@"^[0-9+ ]*$").When(x => !string.IsNullOrEmpty(x.Phone))
            .WithMessage("Số điện thoại không đúng định dạng");

        RuleFor(x => x.Bio)
            .MaximumLength(500).WithMessage("Tiểu sử không được vượt quá 500 ký tự");

        RuleFor(x => x.AvatarFile)
            .Must(f => f == null || f.Length <= MaxFileSize)
            .WithMessage("Kích thước ảnh đại diện không được vượt quá 5MB.")
            .Must(f =>
            {
                if (f == null) return true;
                var ext = Path.GetExtension(f.FileName).ToLowerInvariant();
                return AllowedExtensions.Contains(ext) && AllowedMimeTypes.Contains(f.ContentType.ToLowerInvariant());
            })
            .WithMessage("Ảnh đại diện phải có định dạng hợp lệ (JPG, PNG, WEBP, GIF).");

        RuleFor(x => x.CoverFile)
            .Must(f => f == null || f.Length <= MaxFileSize)
            .WithMessage("Kích thước ảnh bìa không được vượt quá 5MB.")
            .Must(f =>
            {
                if (f == null) return true;
                var ext = Path.GetExtension(f.FileName).ToLowerInvariant();
                return AllowedExtensions.Contains(ext) && AllowedMimeTypes.Contains(f.ContentType.ToLowerInvariant());
            })
            .WithMessage("Ảnh bìa phải có định dạng hợp lệ (JPG, PNG, WEBP, GIF).");
    }
}
