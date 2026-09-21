using Application.Common;
using Application.DTOs.Admin;
using Domain.Enums;

namespace Application.Common.Interfaces.Repositories;

public interface IAdminReviewRepository
{
    Task<PagedResult<AdminReviewItemDto>> GetAdminReviewsAsync(
        bool? hasReportsOnly,
        int? rating,
        string? status,
        string? keyword,
        int page,
        int pageSize,
        CancellationToken ct = default);

    Task<bool> UpdateReviewStatusAsync(long id, ReviewStatus status, CancellationToken ct = default);
    Task<bool> DeleteReviewAsync(long id, CancellationToken ct = default);

    Task<PagedResult<AdminCommentItemDto>> GetAdminCommentsAsync(
        bool? hasReportsOnly,
        string? status,
        string? keyword,
        int page,
        int pageSize,
        CancellationToken ct = default);

    Task<bool> UpdateCommentStatusAsync(long id, CommentStatus status, CancellationToken ct = default);
    Task<bool> DeleteCommentAsync(long id, CancellationToken ct = default);
}
