using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs.Admin;
using MediatR;

namespace Application.Features.Admin.Reviews;

public record GetAdminCommentsQuery(
    bool? HasReportsOnly = null,
    string? Status = null,
    string? Keyword = null,
    int Page = 1,
    int PageSize = 10) : IRequest<Result<PagedResult<AdminCommentItemDto>>>;

public class GetAdminCommentsQueryHandler : IRequestHandler<GetAdminCommentsQuery, Result<PagedResult<AdminCommentItemDto>>>
{
    private readonly IAdminReviewRepository _reviewRepository;

    public GetAdminCommentsQueryHandler(IAdminReviewRepository reviewRepository)
    {
        _reviewRepository = reviewRepository;
    }

    public async Task<Result<PagedResult<AdminCommentItemDto>>> Handle(GetAdminCommentsQuery request, CancellationToken ct)
    {
        var page = request.Page > 0 ? request.Page : 1;
        var pageSize = request.PageSize > 0 ? request.PageSize : 10;

        var result = await _reviewRepository.GetAdminCommentsAsync(
            request.HasReportsOnly,
            request.Status,
            request.Keyword,
            page,
            pageSize,
            ct);

        return Result<PagedResult<AdminCommentItemDto>>.Success(result);
    }
}
