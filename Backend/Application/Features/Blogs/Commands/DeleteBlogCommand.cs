using Application.Common;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Blogs.Commands;

public record DeleteBlogCommand(long Id, long UserId) : IRequest<Result>;

public class DeleteBlogCommandHandler : IRequestHandler<DeleteBlogCommand, Result>
{
    private readonly IUnitOfWork _unitOfWork;

    public DeleteBlogCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result> Handle(DeleteBlogCommand request, CancellationToken ct)
    {
        var blog = await _unitOfWork.Blogs.GetByIdAsync(request.Id, ct);
        if (blog == null)
        {
            return Result.NotFound("Không tìm thấy bài viết.");
        }

        if (blog.AuthorId != request.UserId)
        {
            return Result.Forbidden("Bạn không có quyền xóa bài viết này.");
        }

        _unitOfWork.Blogs.Remove(blog);
        await _unitOfWork.SaveChangesAsync(ct);

        return Result.Success("Đã xóa bài viết thành công.");
    }
}
