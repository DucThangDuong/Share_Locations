using Application.Common;
using Application.Common.Interfaces.Repositories;
using Domain.Enums;
using MediatR;

namespace Application.Features.Admin.Reviews;

public record UpdateAdminCommentStatusCommand(long Id, string Status) : IRequest<Result<bool>>;

public class UpdateAdminCommentStatusCommandHandler : IRequestHandler<UpdateAdminCommentStatusCommand, Result<bool>>
{
    private readonly IAdminReviewRepository _reviewRepository;

    public UpdateAdminCommentStatusCommandHandler(IAdminReviewRepository reviewRepository)
    {
        _reviewRepository = reviewRepository;
    }

    public async Task<Result<bool>> Handle(UpdateAdminCommentStatusCommand request, CancellationToken ct)
    {
        var status = request.Status.ToLowerInvariant() switch
        {
            "active" or "1" => CommentStatus.Active,
            "pending" or "3" => CommentStatus.PendingReview,
            "reported" or "2" => CommentStatus.Reported,
            _ => CommentStatus.Hidden
        };

        var success = await _reviewRepository.UpdateCommentStatusAsync(request.Id, status, ct);
        if (!success)
        {
            return Result<bool>.NotFound("Không tìm thấy bình luận yêu cầu.");
        }

        return Result<bool>.Success(true, "Cập nhật trạng thái bình luận thành công.");
    }
}
