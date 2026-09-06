using FastEndpoints;
using FluentValidation;

namespace API.DTOs.Places;

public class CreatePlaceReportRequest
{
    [BindFrom("id")]
    public long Id { get; set; }

    public string Reason { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ContactEmail { get; set; }
}

public class CreatePlaceReportRequestValidator : Validator<CreatePlaceReportRequest>
{
    public CreatePlaceReportRequestValidator()
    {
        RuleFor(x => x.Id)
            .GreaterThan(0)
            .WithMessage("Mã địa điểm không hợp lệ.");

        RuleFor(x => x.Reason)
            .NotEmpty()
            .WithMessage("Lý do báo cáo không được để trống.")
            .MaximumLength(200)
            .WithMessage("Lý do báo cáo không được vượt quá 200 ký tự.");

        RuleFor(x => x.Description)
            .MaximumLength(1000)
            .WithMessage("Mô tả chi tiết không được vượt quá 1000 ký tự.");

        RuleFor(x => x.ContactEmail)
            .EmailAddress()
            .When(x => !string.IsNullOrWhiteSpace(x.ContactEmail))
            .WithMessage("Email liên hệ không hợp lệ.");
    }
}
