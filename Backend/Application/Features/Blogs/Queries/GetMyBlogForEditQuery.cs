using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Blogs.Queries;

public record GetMyBlogForEditQuery(long BlogId, long UserId) : IRequest<Result<BlogForEditDto>>;

public class GetMyBlogForEditQueryHandler : IRequestHandler<GetMyBlogForEditQuery, Result<BlogForEditDto>>
{
    private readonly IBlogRepository _blogRepository;

    public GetMyBlogForEditQueryHandler(IBlogRepository blogRepository)
    {
        _blogRepository = blogRepository;
    }

    public async Task<Result<BlogForEditDto>> Handle(GetMyBlogForEditQuery request, CancellationToken ct)
    {
        if (request.BlogId <= 0)
        {
            return Result<BlogForEditDto>.Failure("Mã định danh bài viết không hợp lệ.");
        }

        var blog = await _blogRepository.GetBlogForEditAsync(request.BlogId, request.UserId, ct);
        if (blog == null)
        {
            return Result<BlogForEditDto>.Forbidden("Không tìm thấy bài viết hoặc bạn không có quyền truy cập bài viết này.");
        }

        return Result<BlogForEditDto>.Success(blog);
    }
}
