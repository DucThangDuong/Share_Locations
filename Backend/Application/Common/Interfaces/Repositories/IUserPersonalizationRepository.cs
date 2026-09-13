using Application.Common;
using Application.DTOs;

namespace Application.Common.Interfaces.Repositories;

public interface IUserPersonalizationRepository
{
    Task<UserFavoritePagedResultDto> GetFavoritesAsync(
        long userId,
        int? targetType,
        string? keyword,
        string? sortBy,
        int page,
        int pageSize,
        CancellationToken ct = default);

    Task<UserVisitLogPagedResultDto> GetVisitLogsAsync(
        long userId,
        int? privacy,
        int page,
        int pageSize,
        CancellationToken ct = default);

    Task<UserProposalPagedResultDto> GetProposalsAsync(
        long userId,
        int? status,
        int page,
        int pageSize,
        CancellationToken ct = default);

    Task<IReadOnlyList<UserAccessHistoryItemDto>> GetAccessHistoriesAsync(
        long userId,
        int limit,
        CancellationToken ct = default);

    Task<PagedResult<UserReviewItemDto>> GetReviewsAsync(
        long userId,
        int page,
        int pageSize,
        CancellationToken ct = default);

    Task<PagedResult<UserCommentItemDto>> GetCommentsAsync(
        long userId,
        int page,
        int pageSize,
        CancellationToken ct = default);

    Task<PagedResult<UserBlogItemDto>> GetBlogsAsync(
        long userId,
        int? status,
        int page,
        int pageSize,
        CancellationToken ct = default);
}
