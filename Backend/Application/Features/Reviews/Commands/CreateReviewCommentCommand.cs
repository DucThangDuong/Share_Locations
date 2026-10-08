using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using Domain.Entities;
using Domain.Enums;
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
    private readonly INotificationRepository _notificationRepository;
    private readonly INotificationNotifier _notifier;

    public CreateReviewCommentCommandHandler(
        IUnitOfWork unitOfWork,
        INotificationRepository notificationRepository,
        INotificationNotifier notifier)
    {
        _unitOfWork = unitOfWork;
        _notificationRepository = notificationRepository;
        _notifier = notifier;
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

        var review = await _unitOfWork.Reviews.GetByIdAsync(request.ReviewId, ct);
        if (review == null)
        {
            return Result<CommentDto>.NotFound("Bài đánh giá không tồn tại hoặc đã bị ẩn.");
        }

        Comment? parentComment = null;
        if (request.ParentId.HasValue)
        {
            parentComment = await _unitOfWork.Comments.GetByIdAsync(request.ParentId.Value, ct);
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

        // Gửi thông báo cho tác giả bài viết hoặc tác giả bình luận cha
        var targetReceiverId = parentComment != null ? parentComment.UserId : review.UserId;
        if (targetReceiverId != request.UserId)
        {
            try
            {
                var commenterName = !string.IsNullOrWhiteSpace(user.Profile?.FullName) ? user.Profile.FullName : (user.Email ?? "Người dùng");
                var title = parentComment != null ? "Phản hồi mới cho bình luận" : "Bình luận mới cho bài đánh giá";
                var previewContent = request.Content.Length > 60 ? request.Content[..60] + "..." : request.Content;
                var notifContent = parentComment != null
                    ? $"{commenterName} đã trả lời bình luận của bạn: \"{previewContent}\""
                    : $"{commenterName} đã bình luận vào bài đánh giá của bạn: \"{previewContent}\"";

                var notif = await _notificationRepository.CreateNotificationAsync(new CreateNotificationInput
                {
                    UserId = targetReceiverId,
                    ActorUserId = request.UserId,
                    Title = title,
                    Content = notifContent,
                    Type = NotificationType.Review,
                    Priority = 2,
                    EntityType = "REVIEW",
                    EntityId = request.ReviewId,
                    TargetUrl = $"/places/{review.PlaceId}#review-{request.ReviewId}",
                    GroupKey = $"REVIEW_COMMENT_{request.ReviewId}"
                }, ct);

                var unread = await _notificationRepository.GetUnreadCountAsync(targetReceiverId, ct);
                await _notifier.NotifyAsync(targetReceiverId, notif, unread, ct);
            }
            catch
            {
                // Non-blocking notification dispatch
            }
        }

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
