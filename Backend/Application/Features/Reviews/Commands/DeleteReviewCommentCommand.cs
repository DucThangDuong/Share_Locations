using Application.Common;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Reviews.Commands;

public record DeleteReviewCommentCommand(
    long CommentId,
    long UserId,
    bool IsAdmin) : IRequest<Result<bool>>;

public class DeleteReviewCommentCommandHandler : IRequestHandler<DeleteReviewCommentCommand, Result<bool>>
{
    private readonly IUnitOfWork _unitOfWork;

    public DeleteReviewCommentCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<bool>> Handle(DeleteReviewCommentCommand request, CancellationToken ct)
    {
        var comment = await _unitOfWork.Comments.GetByIdAsync(request.CommentId, ct);
        if (comment == null)
        {
            return Result<bool>.NotFound("Bình luận không tồn tại hoặc đã bị xóa.");
        }

        if (comment.UserId != request.UserId && !request.IsAdmin)
        {
            return Result<bool>.Forbidden("Bạn không có quyền xóa bình luận này.");
        }

        comment.Hide();
        _unitOfWork.Comments.Update(comment);
        await _unitOfWork.SaveChangesAsync(ct);

        return Result<bool>.Success(true, "Bình luận đã được xóa thành công.");
    }
}
