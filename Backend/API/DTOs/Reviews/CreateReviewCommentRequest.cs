using FastEndpoints;
using FluentValidation;

namespace API.DTOs.Reviews;

public class CreateReviewCommentRequest
{
    [BindFrom("id")]
    public long ReviewId { get; set; }

    public string Content { get; set; } = string.Empty;

    public long? ParentId { get; set; }
}

public class CreateReviewCommentRequestValidator : Validator<CreateReviewCommentRequest>
{
    public CreateReviewCommentRequestValidator()
    {
        RuleFor(x => x.ReviewId)
            .GreaterThan(0)
            .WithMessage("Mã bài đánh giá không hợp lệ.");

        RuleFor(x => x.Content)
            .NotEmpty()
            .WithMessage("Nội dung bình luận không được để trống.")
            .MaximumLength(1000)
            .WithMessage("Nội dung bình luận không được vượt quá 1000 ký tự.");

        RuleFor(x => x.ParentId)
            .GreaterThan(0)
            .When(x => x.ParentId.HasValue)
            .WithMessage("Mã bình luận cha không hợp lệ.");
    }
}
