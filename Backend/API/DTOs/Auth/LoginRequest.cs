using FastEndpoints;
using FluentValidation;

namespace API.DTOs.Auth;

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class LoginRequestValidator : Validator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email không được để trống")
            .MaximumLength(100).WithMessage("Email quá dài")
            .EmailAddress().WithMessage("Email không đúng định dạng");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Mật khẩu không được để trống")
            .MinimumLength(8).WithMessage("Mật khẩu phải từ 8 ký tự trở lên")
            .MaximumLength(100).WithMessage("Mật khẩu quá dài")
            .Matches(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$")
            .WithMessage("Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt");
    }
}
