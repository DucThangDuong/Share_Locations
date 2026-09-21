using Application.Common;
using Application.Common.Interfaces.Repositories;
using MediatR;

namespace Application.Features.Admin.Reviews;

public record DeleteAdminCommentCommand(long Id) : IRequest<Result<bool>>;

public class DeleteAdminCommentCommandHandler : IRequestHandler<DeleteAdminCommentCommand, Result<bool>>
{
    private readonly IAdminReviewRepository _reviewRepository;

    public DeleteAdminCommentCommandHandler(IAdminReviewRepository reviewRepository)
    {
        _reviewRepository = reviewRepository;
    }

    public async Task<Result<bool>> Handle(DeleteAdminCommentCommand request, CancellationToken ct)
    {
        var success = await _reviewRepository.DeleteCommentAsync(request.Id, ct);
        if (!success)
        {
            return Result<bool>.NotFound("Không tìm thấy bình luận yêu cầu xóa.");
        }

        return Result<bool>.Success(true, "Xóa bình luận thành công.");
    }
}
