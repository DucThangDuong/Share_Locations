using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Users.Queries;

public record GetUserCommentsQuery(long UserId, int Page, int PageSize) : IRequest<Result<PagedResult<UserCommentItemDto>>>;

public class GetUserCommentsQueryHandler : IRequestHandler<GetUserCommentsQuery, Result<PagedResult<UserCommentItemDto>>>
{
    private readonly IUserPersonalizationRepository _repo;

    public GetUserCommentsQueryHandler(IUserPersonalizationRepository repo)
    {
        _repo = repo;
    }

    public async Task<Result<PagedResult<UserCommentItemDto>>> Handle(GetUserCommentsQuery request, CancellationToken ct)
    {
        var result = await _repo.GetCommentsAsync(
            request.UserId,
            request.Page > 0 ? request.Page : 1,
            request.PageSize > 0 ? request.PageSize : 10,
            ct);

        return Result<PagedResult<UserCommentItemDto>>.Success(result, "Lấy danh sách bình luận thành công.");
    }
}
