using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Users.Queries;

public record GetUserBlogsQuery(
    long TargetUserId,
    long? CurrentUserId = null,
    int? Status = null,
    int Page = 1,
    int PageSize = 15) : IRequest<Result<PagedResult<UserBlogItemDto>>>;

public class GetUserBlogsQueryHandler : IRequestHandler<GetUserBlogsQuery, Result<PagedResult<UserBlogItemDto>>>
{
    private readonly IUserPersonalizationRepository _repo;

    public GetUserBlogsQueryHandler(IUserPersonalizationRepository repo)
    {
        _repo = repo;
    }

    public async Task<Result<PagedResult<UserBlogItemDto>>> Handle(GetUserBlogsQuery request, CancellationToken ct)
    {
        // Khi xem cẩm nang của người dùng, luôn chỉ lấy các bài viết đã được công bố / phê duyệt (Status = 1)
        const int publishedStatus = 1;

        var result = await _repo.GetBlogsAsync(
            request.TargetUserId,
            publishedStatus,
            request.Page > 0 ? request.Page : 1,
            request.PageSize > 0 ? request.PageSize : 15,
            ct);

        return Result<PagedResult<UserBlogItemDto>>.Success(result, "Lấy danh sách bài viết đã duyệt thành công.");
    }
}
