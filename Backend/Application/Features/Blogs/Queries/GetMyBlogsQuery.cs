using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Blogs.Queries;

public record GetMyBlogsQuery(
    long UserId,
    int? Status = null,
    int Page = 1,
    int PageSize = 10) : IRequest<Result<PagedResult<UserBlogItemDto>>>;

public class GetMyBlogsQueryHandler : IRequestHandler<GetMyBlogsQuery, Result<PagedResult<UserBlogItemDto>>>
{
    private readonly IUserPersonalizationRepository _repo;

    public GetMyBlogsQueryHandler(IUserPersonalizationRepository repo)
    {
        _repo = repo;
    }

    public async Task<Result<PagedResult<UserBlogItemDto>>> Handle(GetMyBlogsQuery request, CancellationToken ct)
    {
        var result = await _repo.GetBlogsAsync(
            request.UserId,
            request.Status,
            request.Page > 0 ? request.Page : 1,
            request.PageSize > 0 ? request.PageSize : 10,
            ct);

        return Result<PagedResult<UserBlogItemDto>>.Success(result, "Lấy danh sách bài viết của tôi thành công.");
    }
}
