using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs.Admin;
using Dapper;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class AdminReviewRepository : IAdminReviewRepository
{
    private readonly TravelReviewDbContext _dbContext;
    private readonly ICurrentUserService _currentUserService;
    private readonly IAuditLogService _auditLogService;

    public AdminReviewRepository(
        TravelReviewDbContext dbContext,
        ICurrentUserService currentUserService,
        IAuditLogService auditLogService)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
        _auditLogService = auditLogService;
    }

    public async Task<PagedResult<AdminReviewItemDto>> GetAdminReviewsAsync(
        long? placeId,
        bool? hasReportsOnly,
        int? rating,
        string? status,
        string? keyword,
        int page,
        int pageSize,
        CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        var whereClauses = new List<string>();
        var parameters = new DynamicParameters();

        // Áp dụng giới hạn phân quyền theo Scope của Admin cấp 1
        AdminScopeFilterHelper.ApplyPlaceScope(_currentUserService, whereClauses, parameters, "p", "prov");

        if (placeId.HasValue && placeId.Value > 0)
        {
            whereClauses.Add("r.PlaceId = @PlaceId");
            parameters.Add("PlaceId", placeId.Value);
        }

        if (hasReportsOnly == true)
        {
            whereClauses.Add("EXISTS (SELECT 1 FROM dbo.ReviewReports rr WHERE rr.ReviewId = r.Id AND rr.Status = 0)");
        }

        if (rating.HasValue && rating.Value > 0)
        {
            whereClauses.Add("r.Rating = @Rating");
            parameters.Add("Rating", rating.Value);
        }

        if (!string.IsNullOrWhiteSpace(status) && status.ToLowerInvariant() != "all")
        {
            var cleanStatus = status.Trim().ToLowerInvariant();
            if (cleanStatus == "hidden" || cleanStatus == "0")
            {
                whereClauses.Add("r.Status = 0");
            }
            else if (cleanStatus == "active" || cleanStatus == "1")
            {
                whereClauses.Add("r.Status = 1");
            }
            else if (cleanStatus == "reported" || cleanStatus == "2")
            {
                whereClauses.Add("r.Status = 2");
            }
        }

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            whereClauses.Add("(r.Content LIKE @Keyword OR p.Name LIKE @Keyword OR COALESCE(prof.FullName, u.Email) LIKE @Keyword)");
            parameters.Add("Keyword", $"%{keyword.Trim()}%");
        }

        var whereSql = whereClauses.Count > 0 ? " WHERE " + string.Join(" AND ", whereClauses) : "";

        var countSql = $@"
            SELECT COUNT(1)
            FROM dbo.Reviews r
            LEFT JOIN dbo.Places p ON r.PlaceId = p.Id
            LEFT JOIN dbo.Provinces prov ON p.ProvinceId = prov.Id
            LEFT JOIN dbo.Users u ON r.UserId = u.Id
            LEFT JOIN dbo.UserProfiles prof ON u.Id = prof.UserId
            {whereSql};";

        var totalCount = await connection.ExecuteScalarAsync<int>(countSql, parameters);

        var offset = (page - 1) * pageSize;
        parameters.Add("Offset", offset);
        parameters.Add("PageSize", pageSize);

        var dataSql = $@"
            SELECT 
                r.Id,
                r.PlaceId,
                p.Name AS PlaceName,
                COALESCE(
                    p.CoverImageUrl,
                    (SELECT TOP 1 pm.Url FROM dbo.PlaceMedia pm WHERE pm.PlaceId = p.Id ORDER BY pm.DisplayOrder)
                ) AS PlaceCoverImg,
                cat.Name AS Category,
                prov.Name AS Province,
                r.UserId,
                COALESCE(prof.FullName, u.Email, N'Người dùng') AS UserName,
                prof.AvatarUrl AS UserAvatar,
                r.Rating,
                r.Content,
                r.CreatedAt,
                CASE 
                    WHEN r.Status = 0 THEN 'hidden'
                    WHEN r.Status = 2 THEN 'reported'
                    ELSE 'active'
                END AS Status,
                (SELECT COUNT(1) FROM dbo.ReviewReports rr WHERE rr.ReviewId = r.Id) AS ReportCount
            FROM dbo.Reviews r
            LEFT JOIN dbo.Places p ON r.PlaceId = p.Id
            LEFT JOIN dbo.Categories cat ON p.CategoryId = cat.Id
            LEFT JOIN dbo.Provinces prov ON p.ProvinceId = prov.Id
            LEFT JOIN dbo.Users u ON r.UserId = u.Id
            LEFT JOIN dbo.UserProfiles prof ON u.Id = prof.UserId
            {whereSql}
            ORDER BY r.CreatedAt DESC
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;";

        var items = (await connection.QueryAsync<AdminReviewItemDto>(dataSql, parameters)).ToList();

        if (items.Count > 0)
        {
            var reviewIds = items.Select(x => x.Id).ToList();
            const string mediaSql = "SELECT ReviewId, Url AS MediaUrl FROM dbo.ReviewMedia WHERE ReviewId IN @ReviewIds ORDER BY DisplayOrder, Id;";
            var mediaRows = await connection.QueryAsync<(long ReviewId, string MediaUrl)>(mediaSql, new { ReviewIds = reviewIds });
            var mediaLookup = mediaRows.ToLookup(x => x.ReviewId, x => x.MediaUrl);

            foreach (var item in items)
            {
                if (mediaLookup.Contains(item.Id))
                {
                    item.Images = mediaLookup[item.Id].ToList();
                }

                // Nếu review không có ảnh riêng đính kèm, dùng ảnh chính của địa điểm để không bị trống
                if (item.Images.Count == 0 && !string.IsNullOrWhiteSpace(item.PlaceCoverImg))
                {
                    item.Images.Add(item.PlaceCoverImg);
                }
            }
        }

        return new PagedResult<AdminReviewItemDto>(items, totalCount, page, pageSize);
    }

    public async Task<bool> UpdateReviewStatusAsync(long id, ReviewStatus status, CancellationToken ct = default)
    {
        var review = await _dbContext.Reviews.FirstOrDefaultAsync(r => r.Id == id, ct);
        if (review == null) return false;

        if (!await AdminScopeFilterHelper.IsPlaceInScopeAsync(_currentUserService, _dbContext.Database.GetDbConnection(), review.PlaceId))
            return false;

        var oldStatus = review.Status;
        review.UpdateStatus(status);
        await _dbContext.SaveChangesAsync(ct);

        await RecalculatePlaceRatingAsync(review.PlaceId);

        await _auditLogService.LogAsync(
            actionType: "UPDATE_REVIEW_STATUS",
            targetTable: "Reviews",
            targetId: id,
            reason: $"Cập nhật trạng thái đánh giá #{id} sang {status}",
            oldData: new { Status = (int)oldStatus },
            newData: new { Status = (int)status },
            ct: ct);

        return true;
    }

    public async Task<bool> DeleteReviewAsync(long id, CancellationToken ct = default)
    {
        var review = await _dbContext.Reviews.FirstOrDefaultAsync(r => r.Id == id, ct);
        if (review == null) return false;

        if (!await AdminScopeFilterHelper.IsPlaceInScopeAsync(_currentUserService, _dbContext.Database.GetDbConnection(), review.PlaceId))
            return false;

        var placeId = review.PlaceId;
        var oldReviewData = new { Id = review.Id, Content = review.Content, PlaceId = review.PlaceId, UserId = review.UserId, Rating = review.Rating };
        _dbContext.Reviews.Remove(review);
        await _dbContext.SaveChangesAsync(ct);

        await RecalculatePlaceRatingAsync(placeId);

        await _auditLogService.LogAsync(
            actionType: "DELETE_REVIEW",
            targetTable: "Reviews",
            targetId: id,
            reason: $"Xóa đánh giá #{id} tại địa điểm #{placeId}",
            oldData: oldReviewData,
            ct: ct);

        return true;
    }

    public async Task<PagedResult<AdminCommentItemDto>> GetAdminCommentsAsync(
        long? reviewId,
        long? placeId,
        bool? hasReportsOnly,
        string? status,
        string? keyword,
        int page,
        int pageSize,
        CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        var whereClauses = new List<string>();
        var parameters = new DynamicParameters();

        // Áp dụng giới hạn phân quyền theo Scope của Admin cấp 1
        AdminScopeFilterHelper.ApplyPlaceScope(_currentUserService, whereClauses, parameters, "p", "prov");

        if (reviewId.HasValue && reviewId.Value > 0)
        {
            whereClauses.Add("c.ReviewId = @ReviewId");
            parameters.Add("ReviewId", reviewId.Value);
        }

        if (placeId.HasValue && placeId.Value > 0)
        {
            whereClauses.Add("r.PlaceId = @PlaceId");
            parameters.Add("PlaceId", placeId.Value);
        }

        if (hasReportsOnly == true)
        {
            whereClauses.Add("EXISTS (SELECT 1 FROM dbo.CommentReports cr WHERE cr.CommentId = c.Id AND cr.Status = 0)");
        }

        if (!string.IsNullOrWhiteSpace(status) && status.ToLowerInvariant() != "all")
        {
            var cleanStatus = status.Trim().ToLowerInvariant();
            if (cleanStatus == "hidden" || cleanStatus == "0")
            {
                whereClauses.Add("c.Status = 0");
            }
            else if (cleanStatus == "active" || cleanStatus == "1")
            {
                whereClauses.Add("c.Status = 1");
            }
        }

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            whereClauses.Add("(c.Content LIKE @Keyword OR COALESCE(prof.FullName, u.Email) LIKE @Keyword)");
            parameters.Add("Keyword", $"%{keyword.Trim()}%");
        }

        var whereSql = whereClauses.Count > 0 ? " WHERE " + string.Join(" AND ", whereClauses) : "";

        var countSql = $@"
            SELECT COUNT(1)
            FROM dbo.Comments c
            LEFT JOIN dbo.Reviews r ON c.ReviewId = r.Id
            LEFT JOIN dbo.Places p ON r.PlaceId = p.Id
            LEFT JOIN dbo.Provinces prov ON p.ProvinceId = prov.Id
            LEFT JOIN dbo.Users u ON c.UserId = u.Id
            LEFT JOIN dbo.UserProfiles prof ON u.Id = prof.UserId
            {whereSql};";

        var totalCount = await connection.ExecuteScalarAsync<int>(countSql, parameters);

        var offset = (page - 1) * pageSize;
        parameters.Add("Offset", offset);
        parameters.Add("PageSize", pageSize);

        var dataSql = $@"
            SELECT 
                c.Id,
                NULL AS BlogId,
                NULL AS BlogTitle,
                c.ReviewId,
                r.PlaceId,
                p.Name AS PlaceName,
                c.UserId,
                COALESCE(prof.FullName, u.Email, N'Người dùng') AS UserName,
                prof.AvatarUrl AS UserAvatar,
                c.Content,
                c.CreatedAt,
                CASE WHEN c.Status = 1 THEN 'active' ELSE 'hidden' END AS Status,
                (SELECT COUNT(1) FROM dbo.CommentReports cr WHERE cr.CommentId = c.Id) AS ReportCount
            FROM dbo.Comments c
            LEFT JOIN dbo.Reviews r ON c.ReviewId = r.Id
            LEFT JOIN dbo.Places p ON r.PlaceId = p.Id
            LEFT JOIN dbo.Provinces prov ON p.ProvinceId = prov.Id
            LEFT JOIN dbo.Users u ON c.UserId = u.Id
            LEFT JOIN dbo.UserProfiles prof ON u.Id = prof.UserId
            {whereSql}
            ORDER BY c.CreatedAt DESC
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;";

        var items = (await connection.QueryAsync<AdminCommentItemDto>(dataSql, parameters)).ToList();
        return new PagedResult<AdminCommentItemDto>(items, totalCount, page, pageSize);
    }

    public async Task<bool> UpdateCommentStatusAsync(long id, CommentStatus status, CancellationToken ct = default)
    {
        var comment = await _dbContext.Comments.Include(c => c.Review).FirstOrDefaultAsync(c => c.Id == id, ct);
        if (comment == null) return false;

        if (!await AdminScopeFilterHelper.IsPlaceInScopeAsync(_currentUserService, _dbContext.Database.GetDbConnection(), comment.Review.PlaceId))
            return false;

        var oldStatus = comment.Status;
        comment.UpdateStatus(status);
        await _dbContext.SaveChangesAsync(ct);

        await _auditLogService.LogAsync(
            actionType: "UPDATE_COMMENT_STATUS",
            targetTable: "Comments",
            targetId: id,
            reason: $"Cập nhật trạng thái bình luận #{id} sang {status}",
            oldData: new { Status = (int)oldStatus },
            newData: new { Status = (int)status },
            ct: ct);

        return true;
    }

    public async Task<bool> DeleteCommentAsync(long id, CancellationToken ct = default)
    {
        var comment = await _dbContext.Comments.Include(c => c.Review).FirstOrDefaultAsync(c => c.Id == id, ct);
        if (comment == null) return false;

        if (!await AdminScopeFilterHelper.IsPlaceInScopeAsync(_currentUserService, _dbContext.Database.GetDbConnection(), comment.Review.PlaceId))
            return false;

        var oldCommentData = new { Id = comment.Id, Content = comment.Content, ReviewId = comment.ReviewId, UserId = comment.UserId };
        _dbContext.Comments.Remove(comment);
        await _dbContext.SaveChangesAsync(ct);

        await _auditLogService.LogAsync(
            actionType: "DELETE_COMMENT",
            targetTable: "Comments",
            targetId: id,
            reason: $"Xóa bình luận #{id}",
            oldData: oldCommentData,
            ct: ct);

        return true;
    }

    private async Task RecalculatePlaceRatingAsync(long placeId)
    {
        var connection = _dbContext.Database.GetDbConnection();
        const string sql = @"
            UPDATE dbo.Places
            SET 
                AvgRating = COALESCE((SELECT AVG(CAST(Rating AS DECIMAL(3,2))) FROM dbo.Reviews WHERE PlaceId = @PlaceId AND Status = 1), 0),
                ReviewCount = (SELECT COUNT(1) FROM dbo.Reviews WHERE PlaceId = @PlaceId AND Status = 1)
            WHERE Id = @PlaceId;";

        await connection.ExecuteAsync(sql, new { PlaceId = placeId });
    }
}
