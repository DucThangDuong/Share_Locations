using Application.Common;
using Application.Common.Interfaces.Repositories;
using MediatR;

namespace Application.Features.Admin.Blogs;

public record DeleteAdminBlogCommand(long Id) : IRequest<Result<bool>>;

public class DeleteAdminBlogCommandHandler : IRequestHandler<DeleteAdminBlogCommand, Result<bool>>
{
    private readonly IAdminBlogRepository _blogRepository;

    public DeleteAdminBlogCommandHandler(IAdminBlogRepository blogRepository)
    {
        _blogRepository = blogRepository;
    }

    public async Task<Result<bool>> Handle(DeleteAdminBlogCommand request, CancellationToken ct)
    {
        var success = await _blogRepository.DeleteAdminBlogAsync(request.Id, ct);
        if (!success)
        {
            return Result<bool>.NotFound("Không tìm thấy bài viết yêu cầu xóa.");
        }

        return Result<bool>.Success(true, "Xóa bài viết thành công.");
    }
}
