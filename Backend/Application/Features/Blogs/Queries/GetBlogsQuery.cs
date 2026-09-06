using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Blogs.Queries;

public record GetBlogsQuery(
    string? Category = null,
    string? Keyword = null,
    int Page = 1,
    int PageSize = 9) : IRequest<Result<IReadOnlyList<BlogListItemDto>>>;

public class GetBlogsQueryHandler : IRequestHandler<GetBlogsQuery, Result<IReadOnlyList<BlogListItemDto>>>
{
    private readonly IBlogRepository _blogRepository;

    public GetBlogsQueryHandler(IBlogRepository blogRepository)
    {
        _blogRepository = blogRepository;
    }

    public async Task<Result<IReadOnlyList<BlogListItemDto>>> Handle(GetBlogsQuery request, CancellationToken ct)
    {
        var blogs = await _blogRepository.GetBlogsAsync(
            request.Category,
            request.Keyword,
            request.Page,
            request.PageSize,
            ct);

        return Result<IReadOnlyList<BlogListItemDto>>.Success(blogs);
    }
}
