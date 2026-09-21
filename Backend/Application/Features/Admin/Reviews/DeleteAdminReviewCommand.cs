using Application.Common;
using Application.Common.Interfaces.Repositories;
using MediatR;

namespace Application.Features.Admin.Reviews;

public record DeleteAdminReviewCommand(long Id) : IRequest<Result<bool>>;

public class DeleteAdminReviewCommandHandler : IRequestHandler<DeleteAdminReviewCommand, Result<bool>>
{
    private readonly IAdminReviewRepository _reviewRepository;

    public DeleteAdminReviewCommandHandler(IAdminReviewRepository reviewRepository)
    {
        _reviewRepository = reviewRepository;
    }

    public async Task<Result<bool>> Handle(DeleteAdminReviewCommand request, CancellationToken ct)
    {
        var success = await _reviewRepository.DeleteReviewAsync(request.Id, ct);
        if (!success)
        {
            return Result<bool>.NotFound("Không tìm thấy đánh giá yêu cầu xóa.");
        }

        return Result<bool>.Success(true, "Xóa đánh giá thành công.");
    }
}
