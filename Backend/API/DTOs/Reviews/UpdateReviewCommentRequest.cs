using FastEndpoints;
using FluentValidation;

namespace API.DTOs.Reviews;

public class UpdateReviewCommentRequest
{
    [BindFrom("id")]
    public long CommentId { get; set; }

    public string Content { get; set; } = string.Empty;
}

public class UpdateReviewCommentRequestValidator : Validator<UpdateReviewCommentRequest>
{
    public UpdateReviewCommentRequestValidator()
    {
        RuleFor(x => x.CommentId)
            .GreaterThan(0)
            .WithMessage("Mã bình luận không hợp lệ.");

        RuleFor(x => x.Content)
            .NotEmpty()
            .WithMessage("Nội dung bình luận không được để trống.")
            .MaximumLength(1000)
            .WithMessage("Nội dung bình luận không được vượt quá 1000 ký tự.");
    }
}
