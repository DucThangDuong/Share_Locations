using FastEndpoints;
using FluentValidation;
using Microsoft.AspNetCore.Http;

namespace API.DTOs.Places;

public class CreatePlaceReviewRequest
{
    [BindFrom("id")]
    public long Id { get; set; }

    public byte Rating { get; set; }
    public string? Content { get; set; }
    public DateOnly? VisitDate { get; set; }
    public List<IFormFile>? Photos { get; set; }
    public List<IFormFile>? Videos { get; set; }
    public List<string>? Images { get; set; }
}

public class CreatePlaceReviewRequestValidator : Validator<CreatePlaceReviewRequest>
{
    private static readonly HashSet<string> AllowedImageExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp"
    };

    private static readonly HashSet<string> AllowedVideoExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".mp4", ".mov", ".webm"
    };

    public CreatePlaceReviewRequestValidator()
    {
        RuleFor(x => x.Id)
            .GreaterThan(0)
            .WithMessage("Mã địa điểm không hợp lệ.");

        RuleFor(x => x.Rating)
            .InclusiveBetween((byte)1, (byte)5)
            .WithMessage("Điểm đánh giá sao phải từ 1 đến 5 sao.");

        RuleFor(x => x.Content)
            .MaximumLength(2000)
            .WithMessage("Nội dung đánh giá không được vượt quá 2000 ký tự.");

        RuleForEach(x => x.Photos)
            .Must(f => f.Length <= 2 * 1024 * 1024)
            .WithMessage("Mỗi tệp hình ảnh không được vượt quá 2MB.")
            .Must(f => AllowedImageExtensions.Contains(Path.GetExtension(f.FileName)))
            .WithMessage("Hình ảnh chỉ chấp nhận định dạng .jpg, .jpeg, .png, .webp.");

        RuleFor(x => x.Photos)
            .Must(photos => photos == null || photos.Count <= 10)
            .WithMessage("Bạn chỉ có thể tải lên tối đa 10 hình ảnh cho mỗi đánh giá.");

        RuleForEach(x => x.Videos)
            .Must(f => f.Length <= 30 * 1024 * 1024)
            .WithMessage("Mỗi tệp video không được vượt quá 30MB.")
            .Must(f => AllowedVideoExtensions.Contains(Path.GetExtension(f.FileName)))
            .WithMessage("Video chỉ chấp nhận định dạng .mp4, .mov, .webm.");

        RuleFor(x => x.Videos)
            .Must(videos => videos == null || videos.Count <= 2)
            .WithMessage("Bạn chỉ có thể tải lên tối đa 2 video cho mỗi đánh giá.");
    }
}
