using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Users.Queries;

public record GetUserReviewsQuery(
    long TargetUserId,
    long? CurrentUserId = null,
    string? SortBy = null,
    int Page = 1,
    int PageSize = 15) : IRequest<Result<PagedResult<UserReviewItemDto>>>;

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
            request.TargetUserId,
            request.CurrentUserId,
            request.SortBy,
            request.Page > 0 ? request.Page : 1,
            request.PageSize > 0 ? request.PageSize : 15,
            ct);

        return Result<PagedResult<UserReviewItemDto>>.Success(result, "Lấy danh sách đánh giá thành công.");
    }
}
