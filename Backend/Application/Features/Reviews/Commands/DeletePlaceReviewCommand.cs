using Application.Common;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Reviews.Commands;

public record DeletePlaceReviewCommand(
    long ReviewId,
    long UserId,
    bool IsAdmin) : IRequest<Result<bool>>;

public class DeletePlaceReviewCommandHandler : IRequestHandler<DeletePlaceReviewCommand, Result<bool>>
{
    private readonly IUnitOfWork _unitOfWork;

    public DeletePlaceReviewCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<bool>> Handle(DeletePlaceReviewCommand request, CancellationToken ct)
    {
        var review = await _unitOfWork.Reviews.GetByIdAsync(request.ReviewId, ct);
        if (review == null)
        {
            return Result<bool>.NotFound("Bài đánh giá không tồn tại hoặc đã bị xóa.");
        }

        if (review.UserId != request.UserId && !request.IsAdmin)
        {
            return Result<bool>.Forbidden("Bạn không có quyền xóa bài đánh giá này.");
        }

        var place = await _unitOfWork.Places.GetByIdAsync(review.PlaceId, ct);

        await _unitOfWork.ExecuteInTransactionAsync(async () =>
        {
            review.Hide();
            _unitOfWork.Reviews.Update(review);
            await _unitOfWork.SaveChangesAsync(ct);

            if (place != null)
            {
                var (avgRating, reviewCount) = await _unitOfWork.Reviews.GetPlaceStatsAsync(place.Id, ct);
                place.UpdateRating(avgRating, reviewCount);
                _unitOfWork.Places.Update(place);
                await _unitOfWork.SaveChangesAsync(ct);
            }
        }, ct);

        return Result<bool>.Success(true, "Bài đánh giá đã được xóa thành công.");
    }
}
