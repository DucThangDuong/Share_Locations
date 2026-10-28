using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Reviews.Commands;

public record ToggleReviewLikeCommand(long ReviewId, long UserId) : IRequest<Result<ReviewLikeResponseDto>>;

public class ToggleReviewLikeCommandHandler : IRequestHandler<ToggleReviewLikeCommand, Result<ReviewLikeResponseDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly INotificationRepository _notificationRepository;
    private readonly INotificationNotifier _notifier;
    private readonly IReputationService? _reputationService;

    public ToggleReviewLikeCommandHandler(
        IUnitOfWork unitOfWork,
        INotificationRepository notificationRepository,
        INotificationNotifier notifier,
        IReputationService? reputationService = null)
    {
        _unitOfWork = unitOfWork;
        _notificationRepository = notificationRepository;
        _notifier = notifier;
        _reputationService = reputationService;
    }

    public async Task<Result<ReviewLikeResponseDto>> Handle(ToggleReviewLikeCommand request, CancellationToken ct)
    {
        var review = await _unitOfWork.Reviews.GetByIdAsync(request.ReviewId, ct);
        if (review == null)
        {
            return Result<ReviewLikeResponseDto>.NotFound("Bài đánh giá không tồn tại hoặc đã bị ẩn.");
        }

        var existingLike = await _unitOfWork.Reviews.GetLikeAsync(request.ReviewId, request.UserId, ct);
        bool isLiked;

        if (existingLike != null)
        {
            _unitOfWork.Reviews.RemoveLike(existingLike);
            review.DecrementLikes();
            isLiked = false;
        }
        else
        {
            var like = new ReviewLike(request.ReviewId, request.UserId);
            await _unitOfWork.Reviews.AddLikeAsync(like, ct);
            review.IncrementLikes();
            isLiked = true;
        }

        await _unitOfWork.SaveChangesAsync(ct);

        if (_reputationService != null && review.UserId != request.UserId)
        {
            if (isLiked)
            {
                await _reputationService.AwardPointsAsync(
                    review.UserId,
                    ReputationActionType.ReviewLiked,
                    review.Id,
                    "Bài đánh giá nhận được lượt thích hữu ích",
                    ct);
            }
            else
            {
                await _reputationService.DeductPointsAsync(
                    review.UserId,
                    ReputationActionType.ReviewUnliked,
                    2,
                    review.Id,
                    "Hủy lượt thích bài đánh giá",
                    ct);
            }
        }

        if (isLiked && review.UserId != request.UserId)
        {
            try
            {
                var likerProfile = await _unitOfWork.UserProfiles.GetByUserIdAsync(request.UserId, ct);
                var likerName = !string.IsNullOrWhiteSpace(likerProfile?.FullName) ? likerProfile.FullName : "Một người dùng";
                var notif = await _notificationRepository.CreateNotificationAsync(new CreateNotificationInput
                {
                    UserId = review.UserId,
                    ActorUserId = request.UserId,
                    Title = "Lượt thích mới cho bài đánh giá",
                    Content = $"{likerName} đã thích bài đánh giá của bạn.",
                    Type = NotificationType.Review,
                    Priority = 3,
                    EntityType = "REVIEW",
                    EntityId = review.Id,
                    TargetUrl = $"/places/{review.PlaceId}#review-{review.Id}",
                    GroupKey = $"REVIEW_LIKE_{review.Id}",
                    DeduplicationKey = $"LIKE_{request.UserId}_{review.Id}"
                }, ct);

                var unread = await _notificationRepository.GetUnreadCountAsync(review.UserId, ct);
                await _notifier.NotifyAsync(review.UserId, notif, unread, ct);
            }
            catch
            {
            }
        }

        var response = new ReviewLikeResponseDto
        {
            IsLiked = isLiked,
            LikesCount = review.LikesCount
        };

        var message = isLiked ? "Đã thích đánh giá." : "Đã bỏ thích đánh giá.";
        return Result<ReviewLikeResponseDto>.Success(response, message);
    }
}
