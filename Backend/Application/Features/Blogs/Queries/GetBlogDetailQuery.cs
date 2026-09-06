using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Blogs.Queries;

public record GetBlogDetailQuery(string IdOrSlug) : IRequest<Result<BlogDetailDto>>;

public class GetBlogDetailQueryHandler : IRequestHandler<GetBlogDetailQuery, Result<BlogDetailDto>>
{
    private readonly IBlogRepository _blogRepository;

    public GetBlogDetailQueryHandler(IBlogRepository blogRepository)
    {
        _blogRepository = blogRepository;
    }

    public async Task<Result<BlogDetailDto>> Handle(GetBlogDetailQuery request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.IdOrSlug))
        {
            return Result<BlogDetailDto>.Failure("Đường dẫn hoặc mã bài viết không hợp lệ.");
        }

        var blog = await _blogRepository.GetBlogDetailAsync(request.IdOrSlug.Trim(), ct);
        if (blog == null)
        {
            return Result<BlogDetailDto>.NotFound($"Không tìm thấy bài viết cẩm nang du lịch '{request.IdOrSlug}'");
        }

        return Result<BlogDetailDto>.Success(blog);
    }
}
