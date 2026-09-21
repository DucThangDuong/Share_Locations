using Application.Common;
using Application.Common.Interfaces.Repositories;
using Domain.Enums;
using MediatR;

namespace Application.Features.Admin.Reviews;

public record UpdateAdminReviewStatusCommand(long Id, string Status) : IRequest<Result<bool>>;

public class UpdateAdminReviewStatusCommandHandler : IRequestHandler<UpdateAdminReviewStatusCommand, Result<bool>>
{
    private readonly IAdminReviewRepository _reviewRepository;

    public UpdateAdminReviewStatusCommandHandler(IAdminReviewRepository reviewRepository)
    {
        _reviewRepository = reviewRepository;
    }

    public async Task<Result<bool>> Handle(UpdateAdminReviewStatusCommand request, CancellationToken ct)
    {
        var status = request.Status.Equals("active", StringComparison.OrdinalIgnoreCase)
            ? ReviewStatus.Active
            : ReviewStatus.Hidden;

        var success = await _reviewRepository.UpdateReviewStatusAsync(request.Id, status, ct);
        if (!success)
        {
            return Result<bool>.NotFound("Không tìm thấy đánh giá yêu cầu.");
        }

        return Result<bool>.Success(true, "Cập nhật trạng thái đánh giá thành công.");
    }
}
