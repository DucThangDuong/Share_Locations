using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Blogs.Queries;

public record GetBlogsQuery(BlogFilterParams FilterParams) : IRequest<Result<IReadOnlyList<BlogListItemDto>>>
{
    public GetBlogsQuery(
        string? category = null,
        string? keyword = null,
        int page = 1,
        int pageSize = 9) : this(new BlogFilterParams
        {
            Category = category,
            Keyword = keyword,
            Page = page,
            PageSize = pageSize
        })
    {
    }
}

public class GetBlogsQueryHandler : IRequestHandler<GetBlogsQuery, Result<IReadOnlyList<BlogListItemDto>>>
{
    private readonly IBlogRepository _blogRepository;

    public GetBlogsQueryHandler(IBlogRepository blogRepository)
    {
        _blogRepository = blogRepository;
    }

    public async Task<Result<IReadOnlyList<BlogListItemDto>>> Handle(GetBlogsQuery request, CancellationToken ct)
    {
        var blogs = await _blogRepository.GetBlogsAsync(request.FilterParams, ct);

        return Result<IReadOnlyList<BlogListItemDto>>.Success(blogs);
    }
}
