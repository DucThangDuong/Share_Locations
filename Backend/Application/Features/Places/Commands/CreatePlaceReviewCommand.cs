using Application.Common;
using Application.DTOs;
using Domain.Entities;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Places.Commands;

public record CreatePlaceReviewCommand(
    long PlaceId,
    long UserId,
    byte Rating,
    string? Content,
    DateOnly? VisitDate,
    List<string>? MediaUrls) : IRequest<Result<ReviewItemDto>>;

public class CreatePlaceReviewCommandHandler : IRequestHandler<CreatePlaceReviewCommand, Result<ReviewItemDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public CreatePlaceReviewCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
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

        if (request.MediaUrls is { Count: > 0 })
        {
            foreach (var url in request.MediaUrls)
            {
                review.AddMedia(url);
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
            Images = request.MediaUrls ?? [],
            LikesCount = 0,
            CreatedAt = review.CreatedAt
        };

        return Result<ReviewItemDto>.Success(dto, "Đánh giá của bạn đã được đăng thành công.");
    }
}
