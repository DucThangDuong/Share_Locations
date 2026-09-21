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
        var status = request.Status.Equals("active", StringComparison.OrdinalIgnoreCase)
            ? CommentStatus.Active
            : CommentStatus.Hidden;

        var success = await _reviewRepository.UpdateCommentStatusAsync(request.Id, status, ct);
        if (!success)
        {
            return Result<bool>.NotFound("Không tìm thấy bình luận yêu cầu.");
        }

        return Result<bool>.Success(true, "Cập nhật trạng thái bình luận thành công.");
    }
}
