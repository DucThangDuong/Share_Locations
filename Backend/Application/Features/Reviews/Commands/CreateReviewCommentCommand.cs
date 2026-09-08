using Application.Common;
using Application.DTOs;
using Domain.Entities;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Reviews.Commands;

public record CreateReviewCommentCommand(
    long ReviewId,
    long UserId,
    string Content,
    long? ParentId = null) : IRequest<Result<CommentDto>>;

public class CreateReviewCommentCommandHandler : IRequestHandler<CreateReviewCommentCommand, Result<CommentDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public CreateReviewCommentCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<CommentDto>> Handle(CreateReviewCommentCommand request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Content))
        {
            return Result<CommentDto>.Failure("Nội dung bình luận không được để trống.");
        }

        if (request.Content.Length > 1000)
        {
            return Result<CommentDto>.Failure("Nội dung bình luận không được vượt quá 1000 ký tự.");
        }

        var reviewExists = await _unitOfWork.Reviews.ExistsAsync(request.ReviewId, ct);
        if (!reviewExists)
        {
            return Result<CommentDto>.NotFound("Bài đánh giá không tồn tại hoặc đã bị ẩn.");
        }

        if (request.ParentId.HasValue)
        {
            var parentComment = await _unitOfWork.Comments.GetByIdAsync(request.ParentId.Value, ct);
            if (parentComment == null || parentComment.ReviewId != request.ReviewId)
            {
                return Result<CommentDto>.NotFound("Bình luận phản hồi không tồn tại hoặc không thuộc bài đánh giá này.");
            }
        }

        var user = await _unitOfWork.Users.GetByIdWithProfileAsync(request.UserId, ct);
        if (user == null)
        {
            return Result<CommentDto>.NotFound("Người dùng không tồn tại.");
        }

        var comment = new Comment(request.ReviewId, request.UserId, request.Content, request.ParentId);

        await _unitOfWork.Comments.AddAsync(comment, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        var dto = new CommentDto
        {
            Id = comment.Id,
            ReviewId = comment.ReviewId,
            UserId = user.Id.ToString(),
            UserName = user.Profile?.FullName ?? "Người dùng LangThang",
            UserAvatar = user.Profile?.AvatarUrl,
            Content = comment.Content,
            ParentId = comment.ParentId,
            CreatedAt = comment.CreatedAt,
            Replies = []
        };

        return Result<CommentDto>.Success(dto, "Bình luận đã được đăng thành công.");
    }
}
