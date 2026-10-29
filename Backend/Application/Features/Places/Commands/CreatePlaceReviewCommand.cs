using Application.Common;
using Application.Common.Interfaces;
using Application.DTOs;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Places.Commands;

public record CreatePlaceReviewCommand(
    long PlaceId,
    long UserId,
    byte Rating,
    string? Content,
    DateOnly? VisitDate,
    List<FileUploadModel>? Photos = null,
    List<FileUploadModel>? Videos = null,
    List<string>? MediaUrls = null) : IRequest<Result<ReviewItemDto>>;

public class CreatePlaceReviewCommandHandler : IRequestHandler<CreatePlaceReviewCommand, Result<ReviewItemDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IBlobService? _blobService;
    private readonly IRecommendationService _recommendationService;
    private readonly IContentModerationService _moderationService;
    private readonly IReputationService? _reputationService;

    public CreatePlaceReviewCommandHandler(
        IUnitOfWork unitOfWork,
        IRecommendationService recommendationService,
        IContentModerationService moderationService,
        IBlobService? blobService = null,
        IReputationService? reputationService = null)
    {
        _unitOfWork = unitOfWork;
        _recommendationService = recommendationService;
        _moderationService = moderationService;
        _blobService = blobService;
        _reputationService = reputationService;
    }

    public async Task<Result<ReviewItemDto>> Handle(CreatePlaceReviewCommand request, CancellationToken ct)
    {
        if (request.Rating < 1 || request.Rating > 5)
        {
            return Result<ReviewItemDto>.Failure("Đánh giá sao phải nằm trong khoảng từ 1 đến 5 sao.");
        }

        // =========================================================================
        // PIPELINE KIỂM DUYỆT 4 BƯỚC: Tiền xử lý -> Lọc cứng & Spam -> Cảm xúc -> Lệch sao
        // =========================================================================
        var moderation = await _moderationService.ModerateReviewAsync(request.Content, request.Rating, ct);
        if (!moderation.IsPassed)
        {
            return Result<ReviewItemDto>.Failure(moderation.BlockReason ?? "Nội dung vi phạm tiêu chuẩn cộng đồng.");
        }

        var place = await _unitOfWork.Places.GetByIdAsync(request.PlaceId, ct);
        if (place == null || place.IsDeleted)
        {
            return Result<ReviewItemDto>.NotFound("Địa điểm không tồn tại hoặc đã bị xóa.");
        }

        var user = await _unitOfWork.Users.GetByIdWithProfileAsync(request.UserId, ct);
        if (user == null)
        {
            return Result<ReviewItemDto>.NotFound("Người dùng không tồn tại.");
        }

        var alreadyReviewed = await _unitOfWork.Reviews.HasUserReviewedPlaceAsync(request.PlaceId, request.UserId, ct);
        if (alreadyReviewed)
        {
            return Result<ReviewItemDto>.Conflict("Bạn đã đánh giá địa điểm này rồi. Mỗi người dùng chỉ được đánh giá một địa điểm một lần.");
        }

        var review = new Review(request.PlaceId, request.UserId, request.Rating, moderation.CleanedText, request.VisitDate);

        // Nếu phát hiện lệch sao hoặc châm biếm -> Gắn cờ đưa vào hàng chờ duyệt của Admin (PendingReview)
        if (moderation.RecommendedStatus == ReviewStatus.PendingReview)
        {
            review.FlagForPendingReview(moderation.ModerationReason ?? "Cần quản trị viên kiểm tra nội dung/lệch sao.");
        }
        var uploadedImages = new List<string>();
        var uploadedVideos = new List<string>();

        if (request.MediaUrls is { Count: > 0 })
        {
            foreach (var url in request.MediaUrls)
            {
                if (!string.IsNullOrWhiteSpace(url))
                {
                    review.AddMedia(url, FoodMediaType.Image);
                    uploadedImages.Add(url);
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
                    uploadedImages.Add(url);
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
                    uploadedVideos.Add(url);
                }
            }
        }

        await _unitOfWork.ExecuteInTransactionAsync(async () =>
        {
            // Dọn dẹp bản ghi đánh giá cũ đã bị xóa của người dùng tại địa điểm này (nếu có)
            await _unitOfWork.Reviews.DeleteHiddenReviewsByPlaceAndUserAsync(request.PlaceId, request.UserId, ct);

            await _unitOfWork.Reviews.AddAsync(review, ct);
            await _unitOfWork.SaveChangesAsync(ct);

            // Chỉ cập nhật điểm trung bình của quán nếu đánh giá được duyệt tự động (Active)
            if (review.Status == ReviewStatus.Active)
            {
                var (avgRating, reviewCount) = await _unitOfWork.Reviews.GetPlaceStatsAsync(place.Id, ct);
                place.UpdateRating(avgRating, reviewCount);
                _unitOfWork.Places.Update(place);
                await _unitOfWork.SaveChangesAsync(ct);
            }
        }, ct);

        if (review.Status == ReviewStatus.Active)
        {
            await _recommendationService.InvalidateUserVectorCacheAsync(request.UserId, ct);

            if (_reputationService != null)
            {
                var hasMedia = uploadedImages.Count > 0 || uploadedVideos.Count > 0;
                var actionType = hasMedia ? ReputationActionType.ReviewWithMediaCreated : ReputationActionType.ReviewCreated;
                await _reputationService.AwardPointsAsync(
                    request.UserId,
                    actionType,
                    review.Id,
                    $"Đánh giá địa điểm '{place.Name}'",
                    ct);
            }
        }

        var isPending = review.Status == ReviewStatus.PendingReview;
        var dto = new ReviewItemDto
        {
            Id = review.Id,
            UserId = user.Id.ToString(),
            UserName = user.Profile?.FullName ?? "Người dùng LangThang",
            UserAvatar = user.Profile?.AvatarUrl,
            Rating = review.Rating,
            Content = review.Content,
            Images = uploadedImages,
            Videos = uploadedVideos,
            LikesCount = 0,
            CreatedAt = review.CreatedAt,
            Status = isPending ? "pending" : "active",
            HiddenReason = review.HiddenReason,
            HiddenBy = review.HiddenBy,
            HiddenAt = review.HiddenAt
        };

        var responseMessage = isPending
            ? "Đánh giá của bạn đã được tiếp nhận và đưa vào hàng chờ kiểm duyệt do phát hiện dấu hiệu nghi vấn (lệch sao / phản ánh đặc biệt). Quản trị viên sẽ sớm xử lý."
            : "Đánh giá của bạn đã được đăng thành công.";

        return Result<ReviewItemDto>.Success(dto, responseMessage);
    }
}
