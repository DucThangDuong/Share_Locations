using Application.Common;
using Application.Common.Interfaces;
using Application.DTOs;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Reviews.Commands;

public record UpdatePlaceReviewCommand(
    long ReviewId,
    long UserId,
    bool IsAdmin,
    byte Rating,
    string? Content,
    DateOnly? VisitDate = null,
    List<FileUploadModel>? Photos = null,
    List<FileUploadModel>? Videos = null,
    List<string>? ExistingMediaUrls = null) : IRequest<Result<ReviewItemDto>>;

public class UpdatePlaceReviewCommandHandler : IRequestHandler<UpdatePlaceReviewCommand, Result<ReviewItemDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IBlobService? _blobService;
    private readonly IContentModerationService _moderationService;

    public UpdatePlaceReviewCommandHandler(
        IUnitOfWork unitOfWork,
        IContentModerationService moderationService,
        IBlobService? blobService = null)
    {
        _unitOfWork = unitOfWork;
        _moderationService = moderationService;
        _blobService = blobService;
    }

    public async Task<Result<ReviewItemDto>> Handle(UpdatePlaceReviewCommand request, CancellationToken ct)
    {
        if (request.Rating < 1 || request.Rating > 5)
        {
            return Result<ReviewItemDto>.Failure("Đánh giá sao phải nằm trong khoảng từ 1 đến 5 sao.");
        }

        var moderation = await _moderationService.ModerateReviewAsync(request.Content, request.Rating, ct);
        if (!moderation.IsPassed)
        {
            return Result<ReviewItemDto>.Failure(moderation.BlockReason ?? "Nội dung vi phạm tiêu chuẩn cộng đồng.");
        }

        var review = await _unitOfWork.Reviews.GetByIdWithMediaAsync(request.ReviewId, ct);
        if (review == null)
        {
            return Result<ReviewItemDto>.NotFound("Bài đánh giá không tồn tại hoặc đã bị ẩn.");
        }

        if (review.UserId != request.UserId && !request.IsAdmin)
        {
            return Result<ReviewItemDto>.Forbidden("Bạn không có quyền chỉnh sửa bài đánh giá này.");
        }

        var user = await _unitOfWork.Users.GetByIdWithProfileAsync(review.UserId, ct);
        if (user == null)
        {
            return Result<ReviewItemDto>.NotFound("Người dùng không tồn tại.");
        }

        var place = await _unitOfWork.Places.GetByIdAsync(review.PlaceId, ct);
        if (place == null)
        {
            return Result<ReviewItemDto>.NotFound("Địa điểm không tồn tại.");
        }

        review.Update(request.Rating, moderation.CleanedText, request.VisitDate);

        if (moderation.RecommendedStatus == ReviewStatus.PendingReview)
        {
            review.FlagForPendingReview(moderation.ModerationReason ?? "Cần quản trị viên kiểm tra nội dung/lệch sao.");
        }
        else if (review.Status == ReviewStatus.PendingReview && moderation.RecommendedStatus == ReviewStatus.Active)
        {
            review.Restore();
        }

        var finalImages = new List<string>();
        var finalVideos = new List<string>();

        bool mediaModified = request.ExistingMediaUrls != null || (request.Photos != null && request.Photos.Count > 0) || (request.Videos != null && request.Videos.Count > 0);

        if (mediaModified)
        {
            var oldMedia = review.Media.ToList();
            review.ClearMedia();

            if (request.ExistingMediaUrls is { Count: > 0 })
            {
                foreach (var old in oldMedia)
                {
                    if (request.ExistingMediaUrls.Contains(old.Url, StringComparer.OrdinalIgnoreCase))
                    {
                        review.AddMedia(old.Url, old.MediaType);
                        if (old.MediaType == FoodMediaType.Video)
                        {
                            finalVideos.Add(old.Url);
                        }
                        else
                        {
                            finalImages.Add(old.Url);
                        }
                    }
                }
            }

            if (_blobService != null)
            {
                if (request.Photos is { Count: > 0 })
                {
                    foreach (var photo in request.Photos)
                    {
                        var url = await _blobService.UploadImageAsync(
                            photo.Content,
                            photo.FileName,
                            photo.ContentType,
                            "reviews",
                            ct);

                        review.AddMedia(url, FoodMediaType.Image);
                        finalImages.Add(url);
                    }
                }

                if (request.Videos is { Count: > 0 })
                {
                    foreach (var video in request.Videos)
                    {
                        var url = await _blobService.UploadVideoAsync(
                            video.Content,
                            video.FileName,
                            video.ContentType,
                            "reviews",
                            ct);

                        review.AddMedia(url, FoodMediaType.Video);
                        finalVideos.Add(url);
                    }
                }
            }
        }
        else
        {
            finalImages = review.Media.Where(m => m.MediaType == FoodMediaType.Image).Select(m => m.Url).ToList();
            finalVideos = review.Media.Where(m => m.MediaType == FoodMediaType.Video).Select(m => m.Url).ToList();
        }

        await _unitOfWork.ExecuteInTransactionAsync(async () =>
        {
            _unitOfWork.Reviews.Update(review);
            await _unitOfWork.SaveChangesAsync(ct);

            var (avgRating, reviewCount) = await _unitOfWork.Reviews.GetPlaceStatsAsync(place.Id, ct);
            place.UpdateRating(avgRating, reviewCount);
            _unitOfWork.Places.Update(place);
            await _unitOfWork.SaveChangesAsync(ct);
        }, ct);

        var dto = new ReviewItemDto
        {
            Id = review.Id,
            UserId = user.Id.ToString(),
            UserName = user.Profile?.FullName ?? "Người dùng LangThang",
            UserAvatar = user.Profile?.AvatarUrl,
            Rating = review.Rating,
            Content = review.Content,
            Images = finalImages,
            Videos = finalVideos,
            LikesCount = 0,
            CommentsCount = review.Comments.Count(c => c.Status != CommentStatus.Hidden),
            CreatedAt = review.CreatedAt,
            Status = review.Status == ReviewStatus.PendingReview ? "pending" : (review.Status == ReviewStatus.Hidden ? "hidden" : "active"),
            HiddenReason = review.HiddenReason,
            HiddenBy = review.HiddenBy,
            HiddenAt = review.HiddenAt
        };

        return Result<ReviewItemDto>.Success(dto, "Bài đánh giá đã được cập nhật thành công.");
    }
}
