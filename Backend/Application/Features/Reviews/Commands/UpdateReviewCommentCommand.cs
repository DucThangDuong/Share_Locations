using Application.Common;
using Application.DTOs;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Reviews.Commands;

public record UpdateReviewCommentCommand(
    long CommentId,
    long UserId,
    bool IsAdmin,
    string Content) : IRequest<Result<CommentDto>>;

public class UpdateReviewCommentCommandHandler : IRequestHandler<UpdateReviewCommentCommand, Result<CommentDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public UpdateReviewCommentCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<CommentDto>> Handle(UpdateReviewCommentCommand request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Content))
        {
            return Result<CommentDto>.Failure("Nội dung bình luận không được để trống.");
        }

        if (request.Content.Length > 1000)
        {
            return Result<CommentDto>.Failure("Nội dung bình luận không được vượt quá 1000 ký tự.");
        }

        var comment = await _unitOfWork.Comments.GetByIdAsync(request.CommentId, ct);
        if (comment == null)
        {
            return Result<CommentDto>.NotFound("Bình luận không tồn tại hoặc đã bị xóa.");
        }

        if (comment.UserId != request.UserId && !request.IsAdmin)
        {
            return Result<CommentDto>.Forbidden("Bạn không có quyền chỉnh sửa bình luận này.");
        }

        comment.UpdateContent(request.Content);
        _unitOfWork.Comments.Update(comment);
        await _unitOfWork.SaveChangesAsync(ct);

        var dto = new CommentDto
        {
            Id = comment.Id,
            ReviewId = comment.ReviewId,
            UserId = comment.UserId.ToString(),
            UserName = comment.User?.Profile?.FullName ?? "Người dùng LangThang",
            UserAvatar = comment.User?.Profile?.AvatarUrl,
            Content = comment.Content,
            ParentId = comment.ParentId,
            CreatedAt = comment.CreatedAt,
            Replies = []
        };

        return Result<CommentDto>.Success(dto, "Bình luận đã được cập nhật thành công.");
    }
}
