using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Blogs.Queries;

public record GetFeaturedBlogQuery() : IRequest<Result<BlogListItemDto>>;

public class GetFeaturedBlogQueryHandler : IRequestHandler<GetFeaturedBlogQuery, Result<BlogListItemDto>>
{
    private readonly IBlogRepository _blogRepository;

    public GetFeaturedBlogQueryHandler(IBlogRepository blogRepository)
    {
        _blogRepository = blogRepository;
    }

    public async Task<Result<BlogListItemDto>> Handle(GetFeaturedBlogQuery request, CancellationToken ct)
    {
        var featuredBlog = await _blogRepository.GetFeaturedBlogAsync(ct);
        if (featuredBlog == null)
        {
            return Result<BlogListItemDto>.NotFound("Hiện chưa có bài viết tiêu điểm nổi bật nào.");
        }

        return Result<BlogListItemDto>.Success(featuredBlog);
    }
}
