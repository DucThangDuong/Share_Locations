using FastEndpoints;
using FluentValidation;

namespace API.DTOs.Auth;

public class UpdateProfileRequest
{
    public string FullName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? AvatarUrl { get; set; }
    public string? CoverUrl { get; set; }
    public string? Bio { get; set; }
}

public class UpdateProfileRequestValidator : Validator<UpdateProfileRequest>
{
    public UpdateProfileRequestValidator()
    {
        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Họ tên không được để trống")
            .MinimumLength(2).WithMessage("Họ tên phải từ 2 ký tự trở lên")
            .MaximumLength(50).WithMessage("Họ tên không được vượt quá 50 ký tự");

        RuleFor(x => x.Phone)
            .MaximumLength(20).WithMessage("Số điện thoại không được vượt quá 20 ký tự")
            .Matches(@"^[0-9+ ]*$").When(x => !string.IsNullOrEmpty(x.Phone))
            .WithMessage("Số điện thoại không đúng định dạng");

        RuleFor(x => x.Bio)
            .MaximumLength(500).WithMessage("Tiểu sử không được vượt quá 500 ký tự");

        RuleFor(x => x.AvatarUrl)
            .MaximumLength(1000).WithMessage("Đường dẫn ảnh đại diện quá dài");

        RuleFor(x => x.CoverUrl)
            .MaximumLength(1000).WithMessage("Đường dẫn ảnh bìa quá dài");
    }
}
