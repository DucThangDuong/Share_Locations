using Application.Common;
using Application.Common.Interfaces;
using Application.DTOs;
using Domain.Enums;
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
    private readonly IContentModerationService _moderationService;

    public UpdateReviewCommentCommandHandler(
        IUnitOfWork unitOfWork,
        IContentModerationService moderationService)
    {
        _unitOfWork = unitOfWork;
        _moderationService = moderationService;
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

        // =========================================================================
        // KIỂM DUYỆT BÌNH LUẬN: Tiền xử lý -> Lọc vi phạm cứng & Spam
        // =========================================================================
        var moderation = await _moderationService.ModerateCommentAsync(request.Content, ct);
        if (!moderation.IsPassed)
        {
            return Result<CommentDto>.Failure(moderation.BlockReason ?? "Nội dung bình luận vi phạm tiêu chuẩn cộng đồng.");
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

        comment.UpdateContent(moderation.CleanedText);

        if (moderation.RecommendedStatus == ReviewStatus.PendingReview)
        {
            comment.FlagForPendingReview(moderation.ModerationReason ?? "Cần quản trị viên kiểm tra nội dung bình luận.");
        }
        else if (comment.Status == CommentStatus.PendingReview)
        {
            comment.Restore();
        }

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
            Status = comment.Status == CommentStatus.PendingReview ? "pending" : (comment.Status == CommentStatus.Hidden ? "hidden" : "active"),
            HiddenReason = comment.HiddenReason,
            HiddenBy = comment.HiddenBy,
            HiddenAt = comment.HiddenAt,
            Replies = []
        };

        return Result<CommentDto>.Success(dto, "Bình luận đã được cập nhật thành công.");
    }
}
