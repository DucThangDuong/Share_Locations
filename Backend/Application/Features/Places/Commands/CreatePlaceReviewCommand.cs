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

    public CreatePlaceReviewCommandHandler(IUnitOfWork unitOfWork, IBlobService? blobService = null)
    {
        _unitOfWork = unitOfWork;
        _blobService = blobService;
    }

    public async Task<Result<ReviewItemDto>> Handle(CreatePlaceReviewCommand request, CancellationToken ct)
    {
        if (request.Rating < 1 || request.Rating > 5)
        {
            return Result<ReviewItemDto>.Failure("Đánh giá sao phải nằm trong khoảng từ 1 đến 5 sao.");
        }

        var place = await _unitOfWork.Places.GetByIdAsync(request.PlaceId, ct);
        if (place == null)
        {
            return Result<ReviewItemDto>.NotFound("Địa điểm không tồn tại.");
        }

        var user = await _unitOfWork.Users.GetByIdWithProfileAsync(request.UserId, ct);
        if (user == null)
        {
            return Result<ReviewItemDto>.NotFound("Người dùng không tồn tại.");
        }

        var review = new Review(request.PlaceId, request.UserId, request.Rating, request.Content, request.VisitDate);
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
            await _unitOfWork.Reviews.AddAsync(review, ct);
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
            Images = uploadedImages,
            Videos = uploadedVideos,
            LikesCount = 0,
            CreatedAt = review.CreatedAt
        };

        return Result<ReviewItemDto>.Success(dto, "Đánh giá của bạn đã được đăng thành công.");
    }
}
