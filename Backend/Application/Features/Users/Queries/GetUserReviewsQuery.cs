using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Users.Queries;

public record GetUserReviewsQuery(long UserId, int Page, int PageSize) : IRequest<Result<PagedResult<UserReviewItemDto>>>;

public class GetUserReviewsQueryHandler : IRequestHandler<GetUserReviewsQuery, Result<PagedResult<UserReviewItemDto>>>
{
    private readonly IUserPersonalizationRepository _repo;

    public GetUserReviewsQueryHandler(IUserPersonalizationRepository repo)
    {
        _repo = repo;
    }

    public async Task<Result<PagedResult<UserReviewItemDto>>> Handle(GetUserReviewsQuery request, CancellationToken ct)
    {
        var result = await _repo.GetReviewsAsync(
            request.UserId,
            request.Page > 0 ? request.Page : 1,
            request.PageSize > 0 ? request.PageSize : 10,
            ct);

        return Result<PagedResult<UserReviewItemDto>>.Success(result, "Lấy danh sách đánh giá thành công.");
    }
}
