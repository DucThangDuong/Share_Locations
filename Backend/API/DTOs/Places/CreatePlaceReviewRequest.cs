using FastEndpoints;
using FluentValidation;

namespace API.DTOs.Places;

public class CreatePlaceReviewRequest
{
    [BindFrom("id")]
    public long Id { get; set; }

    public byte Rating { get; set; }
    public string? Content { get; set; }
    public List<string>? Images { get; set; }
    public DateOnly? VisitDate { get; set; }
}

public class CreatePlaceReviewRequestValidator : Validator<CreatePlaceReviewRequest>
{
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
    }
}
