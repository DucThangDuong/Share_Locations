using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Users.Queries;

public record GetUserBlogsQuery(
    long UserId,
    int? Status,
    int Page,
    int PageSize) : IRequest<Result<PagedResult<UserBlogItemDto>>>;

public class GetUserBlogsQueryHandler : IRequestHandler<GetUserBlogsQuery, Result<PagedResult<UserBlogItemDto>>>
{
    private readonly IUserPersonalizationRepository _repo;

    public GetUserBlogsQueryHandler(IUserPersonalizationRepository repo)
    {
        _repo = repo;
    }

    public async Task<Result<PagedResult<UserBlogItemDto>>> Handle(GetUserBlogsQuery request, CancellationToken ct)
    {
        var result = await _repo.GetBlogsAsync(
            request.UserId,
            request.Status,
            request.Page > 0 ? request.Page : 1,
            request.PageSize > 0 ? request.PageSize : 12,
            ct);

        return Result<PagedResult<UserBlogItemDto>>.Success(result, "Lấy danh sách bài viết thành công.");
    }
}
