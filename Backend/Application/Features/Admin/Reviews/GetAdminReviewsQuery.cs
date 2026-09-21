using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs.Admin;
using MediatR;

namespace Application.Features.Admin.Reviews;

public record GetAdminReviewsQuery(
    bool? HasReportsOnly = null,
    int? Rating = null,
    string? Status = null,
    string? Keyword = null,
    int Page = 1,
    int PageSize = 10) : IRequest<Result<PagedResult<AdminReviewItemDto>>>;

public class GetAdminReviewsQueryHandler : IRequestHandler<GetAdminReviewsQuery, Result<PagedResult<AdminReviewItemDto>>>
{
    private readonly IAdminReviewRepository _reviewRepository;

    public GetAdminReviewsQueryHandler(IAdminReviewRepository reviewRepository)
    {
        _reviewRepository = reviewRepository;
    }

    public async Task<Result<PagedResult<AdminReviewItemDto>>> Handle(GetAdminReviewsQuery request, CancellationToken ct)
    {
        var page = request.Page > 0 ? request.Page : 1;
        var pageSize = request.PageSize > 0 ? request.PageSize : 10;

        var result = await _reviewRepository.GetAdminReviewsAsync(
            request.HasReportsOnly,
            request.Rating,
            request.Status,
            request.Keyword,
            page,
            pageSize,
            ct);

        return Result<PagedResult<AdminReviewItemDto>>.Success(result);
    }
}
