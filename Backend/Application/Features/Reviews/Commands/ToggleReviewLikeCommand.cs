using Application.Common;
using Application.DTOs;
using Domain.Entities;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Reviews.Commands;

public record ToggleReviewLikeCommand(long ReviewId, long UserId) : IRequest<Result<ReviewLikeResponseDto>>;

public class ToggleReviewLikeCommandHandler : IRequestHandler<ToggleReviewLikeCommand, Result<ReviewLikeResponseDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public ToggleReviewLikeCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
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

        var response = new ReviewLikeResponseDto
        {
            IsLiked = isLiked,
            LikesCount = review.LikesCount
        };

        var message = isLiked ? "Đã thích đánh giá." : "Đã bỏ thích đánh giá.";
        return Result<ReviewLikeResponseDto>.Success(response, message);
    }
}
