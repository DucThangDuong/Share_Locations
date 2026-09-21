using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs.Admin;
using MediatR;

namespace Application.Features.Admin.Blogs;

public record GetAdminBlogsQuery(
    int? CategoryId = null,
    string? Status = null,
    string? Keyword = null,
    int Page = 1,
    int PageSize = 10) : IRequest<Result<PagedResult<AdminBlogListItemDto>>>;

public class GetAdminBlogsQueryHandler : IRequestHandler<GetAdminBlogsQuery, Result<PagedResult<AdminBlogListItemDto>>>
{
    private readonly IAdminBlogRepository _blogRepository;

    public GetAdminBlogsQueryHandler(IAdminBlogRepository blogRepository)
    {
        _blogRepository = blogRepository;
    }

    public async Task<Result<PagedResult<AdminBlogListItemDto>>> Handle(GetAdminBlogsQuery request, CancellationToken ct)
    {
        var page = request.Page > 0 ? request.Page : 1;
        var pageSize = request.PageSize > 0 ? request.PageSize : 10;

        var result = await _blogRepository.GetAdminBlogsAsync(
            request.CategoryId,
            request.Status,
            request.Keyword,
            page,
            pageSize,
            ct);

        return Result<PagedResult<AdminBlogListItemDto>>.Success(result);
    }
}
