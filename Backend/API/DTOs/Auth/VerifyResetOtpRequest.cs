using FluentValidation;

namespace API.DTOs.Auth;

public class VerifyResetOtpRequest
{
    public string Email { get; set; } = string.Empty;
    public string OtpCode { get; set; } = string.Empty;
}

public class VerifyResetOtpRequestValidator : AbstractValidator<VerifyResetOtpRequest>
{
    public VerifyResetOtpRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email không được để trống.")
            .EmailAddress().WithMessage("Định dạng email không hợp lệ.");

        RuleFor(x => x.OtpCode)
            .NotEmpty().WithMessage("Mã OTP không được để trống.")
            .Length(6).WithMessage("Mã OTP phải đúng 6 chữ số.")
            .Matches("^[0-9]{6}$").WithMessage("Mã OTP chỉ bao gồm chữ số.");
    }
}
