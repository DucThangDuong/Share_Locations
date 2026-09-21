using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs.Admin;
using Dapper;
using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class AdminReportRepository : IAdminReportRepository
{
    private readonly TravelReviewDbContext _dbContext;

    public AdminReportRepository(TravelReviewDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<ReportReasonDto>> GetReportReasonsAsync(string? targetType = null, CancellationToken ct = default)
    {
        var types = await _dbContext.ReportTypes
            .Where(r => r.IsActive)
            .OrderBy(r => r.DisplayOrder)
            .ToListAsync(ct);

        var list = types.Select(r =>
        {
            var applicable = new List<string>();
            if (r.Code.StartsWith("PLACE_"))
            {
                applicable.Add("place");
            }
            else if (r.Code.StartsWith("CONTENT_"))
            {
                applicable.AddRange(new[] { "review", "comment", "blog" });
            }
            else
            {
                applicable.AddRange(new[] { "place", "review", "comment", "blog" });
            }

            return new ReportReasonDto
            {
                Id = r.Id,
                Code = r.Code,
                Title = r.Name,
                Category = r.Code.StartsWith("PLACE_") ? "Địa điểm" : "Nội dung",
                Description = r.Name,
                ApplicableTargets = applicable
            };
        }).ToList();

        if (!string.IsNullOrWhiteSpace(targetType))
        {
            var target = targetType.Trim().ToLowerInvariant();
            list = list.Where(x => x.ApplicableTargets.Contains(target)).ToList();
        }

        return list;
    }

    public async Task<long> CreateReportAsync(string targetType, long targetId, int reportTypeId, string? reason, long? reporterId, CancellationToken ct = default)
    {
        // Fallback user if reporterId is null (system guest account ID = 1 or first user)
        long actualReporterId = reporterId ?? 1;

        switch (targetType.Trim().ToLowerInvariant())
        {
            case "place":
                var placeReport = new PlaceReport(actualReporterId, targetId, reportTypeId, reason);
                _dbContext.PlaceReports.Add(placeReport);
                await _dbContext.SaveChangesAsync(ct);
                return placeReport.Id;

            case "review":
                var reviewReport = new ReviewReport(actualReporterId, targetId, reportTypeId, reason);
                _dbContext.ReviewReports.Add(reviewReport);
                await _dbContext.SaveChangesAsync(ct);
                return reviewReport.Id;

            case "comment":
                var commentReport = new CommentReport(actualReporterId, targetId, reportTypeId, reason);
                _dbContext.CommentReports.Add(commentReport);
                await _dbContext.SaveChangesAsync(ct);
                return commentReport.Id;

            case "blog":
                var blogReport = new BlogReport(actualReporterId, targetId, reportTypeId, reason);
                _dbContext.BlogReports.Add(blogReport);
                await _dbContext.SaveChangesAsync(ct);
                return blogReport.Id;

            default:
                throw new ArgumentException($"Loại đối tượng '{targetType}' không được hỗ trợ.");
        }
    }

    public async Task<IReadOnlyList<ReportQueueItemDto>> GetMyReportsAsync(long userId, CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        const string sql = @"
            SELECT 
                pr.Id,
                CONCAT('REP-P', pr.Id) AS CodeId,
                'place' AS TargetType,
                pr.PlaceId AS TargetId,
                p.Name AS TargetTitle,
                p.Address AS TargetSubtitle,
                pr.Reason AS ReasonContent,
                pr.Reason AS Description,
                pr.CreatedAt AS SubmittedAt,
                CAST(pr.Status AS INT) AS Status
            FROM dbo.PlaceReports pr
            LEFT JOIN dbo.Places p ON pr.PlaceId = p.Id
            WHERE pr.ReporterId = @UserId

            UNION ALL

            SELECT 
                rr.Id,
                CONCAT('REP-R', rr.Id) AS CodeId,
                'review' AS TargetType,
                rr.ReviewId AS TargetId,
                CONCAT(N'Đánh giá tại ', p.Name) AS TargetTitle,
                p.Name AS TargetSubtitle,
                rr.Reason AS ReasonContent,
                rr.Reason AS Description,
                rr.CreatedAt AS SubmittedAt,
                CAST(rr.Status AS INT) AS Status
            FROM dbo.ReviewReports rr
            LEFT JOIN dbo.Reviews r ON rr.ReviewId = r.Id
            LEFT JOIN dbo.Places p ON r.PlaceId = p.Id
            WHERE rr.ReporterId = @UserId

            UNION ALL

            SELECT 
                cr.Id,
                CONCAT('REP-C', cr.Id) AS CodeId,
                'comment' AS TargetType,
                cr.CommentId AS TargetId,
                N'Bình luận' AS TargetTitle,
                NULL AS TargetSubtitle,
                cr.Reason AS ReasonContent,
                cr.Reason AS Description,
                cr.CreatedAt AS SubmittedAt,
                CAST(cr.Status AS INT) AS Status
            FROM dbo.CommentReports cr
            WHERE cr.ReporterId = @UserId

            UNION ALL

            SELECT 
                br.Id,
                CONCAT('REP-B', br.Id) AS CodeId,
                'blog' AS TargetType,
                br.BlogId AS TargetId,
                b.Title AS TargetTitle,
                NULL AS TargetSubtitle,
                br.Reason AS ReasonContent,
                br.Reason AS Description,
                br.CreatedAt AS SubmittedAt,
                CAST(br.Status AS INT) AS Status
            FROM dbo.BlogReports br
            LEFT JOIN dbo.Blogs b ON br.BlogId = b.Id
            WHERE br.ReporterId = @UserId

            ORDER BY SubmittedAt DESC;";

        var rows = await connection.QueryAsync<ReportQueueItemDto>(sql, new { UserId = userId });
        return rows.ToList();
    }

    public async Task<PagedResult<ReportQueueItemDto>> GetReportsQueueAsync(
        string? subTab,
        string? targetType,
        int? status,
        string? keyword,
        int page,
        int pageSize,
        CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        const string baseSql = @"
            WITH AllReports AS (
                SELECT 
                    pr.Id,
                    CONCAT('REP-P', pr.Id) AS CodeId,
                    'place' AS TargetType,
                    pr.PlaceId AS TargetId,
                    p.Name AS TargetTitle,
                    p.Address AS TargetSubtitle,
                    p.Description AS TargetContent,
                    p.CoverImageUrl AS TargetImage,
                    pr.ReporterId,
                    COALESCE(prof.FullName, u.Email, N'Người dùng') AS ReporterName,
                    prof.AvatarUrl AS ReporterAvatar,
                    rt.Code AS ReportTypeCode,
                    rt.Name AS ReportTypeName,
                    pr.Reason AS ReasonContent,
                    pr.Reason AS Description,
                    pr.CreatedAt AS SubmittedAt,
                    CASE 
                        WHEN rt.Code IN ('PLACE_CLOSED', 'CONTENT_SPAM', 'CONTENT_OFFENSIVE') THEN 'urgent'
                        WHEN rt.Code IN ('CONTENT_FAKE', 'CONTENT_COPYRIGHT') THEN 'high'
                        ELSE 'normal'
                    END AS Priority,
                    CAST(pr.Status AS INT) AS Status,
                    pr.ResolvedBy AS AssignedToAdminId,
                    COALESCE(adminProf.FullName, adminU.Email) AS AssignedToAdminName,
                    prov.Name AS Province,
                    cat.Name AS Category
                FROM dbo.PlaceReports pr
                LEFT JOIN dbo.Places p ON pr.PlaceId = p.Id
                LEFT JOIN dbo.Provinces prov ON p.ProvinceId = prov.Id
                LEFT JOIN dbo.Categories cat ON p.CategoryId = cat.Id
                LEFT JOIN dbo.ReportTypes rt ON pr.ReportTypeId = rt.Id
                LEFT JOIN dbo.Users u ON pr.ReporterId = u.Id
                LEFT JOIN dbo.UserProfiles prof ON u.Id = prof.UserId
                LEFT JOIN dbo.Users adminU ON pr.ResolvedBy = adminU.Id
                LEFT JOIN dbo.UserProfiles adminProf ON adminU.Id = adminProf.UserId

                UNION ALL

                SELECT 
                    rr.Id,
                    CONCAT('REP-R', rr.Id) AS CodeId,
                    'review' AS TargetType,
                    rr.ReviewId AS TargetId,
                    CONCAT(N'Đánh giá tại ', p.Name) AS TargetTitle,
                    CONCAT(p.Name, N' • ', prov.Name) AS TargetSubtitle,
                    r.Content AS TargetContent,
                    NULL AS TargetImage,
                    rr.ReporterId,
                    COALESCE(prof.FullName, u.Email, N'Người dùng') AS ReporterName,
                    prof.AvatarUrl AS ReporterAvatar,
                    rt.Code AS ReportTypeCode,
                    rt.Name AS ReportTypeName,
                    rr.Reason AS ReasonContent,
                    rr.Reason AS Description,
                    rr.CreatedAt AS SubmittedAt,
                    CASE 
                        WHEN rt.Code IN ('CONTENT_OFFENSIVE', 'CONTENT_SPAM') THEN 'urgent'
                        WHEN rt.Code IN ('CONTENT_FAKE', 'CONTENT_COPYRIGHT') THEN 'high'
                        ELSE 'normal'
                    END AS Priority,
                    CAST(rr.Status AS INT) AS Status,
                    rr.ResolvedBy AS AssignedToAdminId,
                    COALESCE(adminProf.FullName, adminU.Email) AS AssignedToAdminName,
                    prov.Name AS Province,
                    cat.Name AS Category
                FROM dbo.ReviewReports rr
                LEFT JOIN dbo.Reviews r ON rr.ReviewId = r.Id
                LEFT JOIN dbo.Places p ON r.PlaceId = p.Id
                LEFT JOIN dbo.Provinces prov ON p.ProvinceId = prov.Id
                LEFT JOIN dbo.Categories cat ON p.CategoryId = cat.Id
                LEFT JOIN dbo.ReportTypes rt ON rr.ReportTypeId = rt.Id
                LEFT JOIN dbo.Users u ON rr.ReporterId = u.Id
                LEFT JOIN dbo.UserProfiles prof ON u.Id = prof.UserId
                LEFT JOIN dbo.Users adminU ON rr.ResolvedBy = adminU.Id
                LEFT JOIN dbo.UserProfiles adminProf ON adminU.Id = adminProf.UserId

                UNION ALL

                SELECT 
                    cr.Id,
                    CONCAT('REP-C', cr.Id) AS CodeId,
                    'comment' AS TargetType,
                    cr.CommentId AS TargetId,
                    N'Bình luận' AS TargetTitle,
                    NULL AS TargetSubtitle,
                    c.Content AS TargetContent,
                    NULL AS TargetImage,
                    cr.ReporterId,
                    COALESCE(prof.FullName, u.Email, N'Người dùng') AS ReporterName,
                    prof.AvatarUrl AS ReporterAvatar,
                    rt.Code AS ReportTypeCode,
                    rt.Name AS ReportTypeName,
                    cr.Reason AS ReasonContent,
                    cr.Reason AS Description,
                    cr.CreatedAt AS SubmittedAt,
                    'normal' AS Priority,
                    CAST(cr.Status AS INT) AS Status,
                    cr.ResolvedBy AS AssignedToAdminId,
                    COALESCE(adminProf.FullName, adminU.Email) AS AssignedToAdminName,
                    NULL AS Province,
                    NULL AS Category
                FROM dbo.CommentReports cr
                LEFT JOIN dbo.Comments c ON cr.CommentId = c.Id
                LEFT JOIN dbo.ReportTypes rt ON cr.ReportTypeId = rt.Id
                LEFT JOIN dbo.Users u ON cr.ReporterId = u.Id
                LEFT JOIN dbo.UserProfiles prof ON u.Id = prof.UserId
                LEFT JOIN dbo.Users adminU ON cr.ResolvedBy = adminU.Id
                LEFT JOIN dbo.UserProfiles adminProf ON adminU.Id = adminProf.UserId

                UNION ALL

                SELECT 
                    br.Id,
                    CONCAT('REP-B', br.Id) AS CodeId,
                    'blog' AS TargetType,
                    br.BlogId AS TargetId,
                    b.Title AS TargetTitle,
                    NULL AS TargetSubtitle,
                    b.Excerpt AS TargetContent,
                    b.CoverImageUrl AS TargetImage,
                    br.ReporterId,
                    COALESCE(prof.FullName, u.Email, N'Người dùng') AS ReporterName,
                    prof.AvatarUrl AS ReporterAvatar,
                    rt.Code AS ReportTypeCode,
                    rt.Name AS ReportTypeName,
                    br.Reason AS ReasonContent,
                    br.Reason AS Description,
                    br.CreatedAt AS SubmittedAt,
                    'normal' AS Priority,
                    CAST(br.Status AS INT) AS Status,
                    br.ResolvedBy AS AssignedToAdminId,
                    COALESCE(adminProf.FullName, adminU.Email) AS AssignedToAdminName,
                    NULL AS Province,
                    cat.Name AS Category
                FROM dbo.BlogReports br
                LEFT JOIN dbo.Blogs b ON br.BlogId = b.Id
                LEFT JOIN dbo.Categories cat ON b.CategoryId = cat.Id
                LEFT JOIN dbo.ReportTypes rt ON br.ReportTypeId = rt.Id
                LEFT JOIN dbo.Users u ON br.ReporterId = u.Id
                LEFT JOIN dbo.UserProfiles prof ON u.Id = prof.UserId
                LEFT JOIN dbo.Users adminU ON br.ResolvedBy = adminU.Id
                LEFT JOIN dbo.UserProfiles adminProf ON adminU.Id = adminProf.UserId
            )";

        var whereClauses = new List<string>();
        var parameters = new DynamicParameters();

        if (!string.IsNullOrWhiteSpace(targetType) && targetType.ToLowerInvariant() != "all")
        {
            whereClauses.Add("TargetType = @TargetType");
            parameters.Add("TargetType", targetType.Trim().ToLowerInvariant());
        }

        if (status.HasValue)
        {
            whereClauses.Add("Status = @Status");
            parameters.Add("Status", status.Value);
        }

        if (!string.IsNullOrWhiteSpace(subTab))
        {
            if (subTab.Equals("urgent", StringComparison.OrdinalIgnoreCase))
            {
                whereClauses.Add("Priority = 'urgent' AND Status = 0");
            }
            else if (subTab.Equals("resolved", StringComparison.OrdinalIgnoreCase))
            {
                whereClauses.Add("Status = 1");
            }
        }

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            whereClauses.Add("(TargetTitle LIKE @Keyword OR CodeId LIKE @Keyword OR ReporterName LIKE @Keyword)");
            parameters.Add("Keyword", $"%{keyword.Trim()}%");
        }

        var whereSql = whereClauses.Count > 0 ? " WHERE " + string.Join(" AND ", whereClauses) : "";

        var countSql = $"{baseSql} SELECT COUNT(1) FROM AllReports {whereSql};";
        var totalCount = await connection.ExecuteScalarAsync<int>(countSql, parameters);

        var offset = (page - 1) * pageSize;
        parameters.Add("Offset", offset);
        parameters.Add("PageSize", pageSize);

        var dataSql = $"{baseSql} SELECT * FROM AllReports {whereSql} ORDER BY SubmittedAt DESC OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;";
        var items = (await connection.QueryAsync<ReportQueueItemDto>(dataSql, parameters)).ToList();

        return new PagedResult<ReportQueueItemDto>(items, totalCount, page, pageSize);
    }

    public async Task<IReadOnlyList<GroupedReportDto>> GetGroupedReportsAsync(CancellationToken ct = default)
    {
        var queue = await GetReportsQueueAsync(null, null, 0, null, 1, 100, ct);

        var groups = queue.Items
            .GroupBy(r => $"{r.TargetType}_{r.TargetId}")
            .Select(g =>
            {
                var first = g.First();
                return new GroupedReportDto
                {
                    GroupKey = g.Key,
                    TargetType = first.TargetType,
                    TargetId = first.TargetId,
                    TargetTitle = first.TargetTitle,
                    TargetSubtitle = first.TargetSubtitle,
                    TargetContent = first.TargetContent,
                    Province = first.Province,
                    Category = first.Category,
                    ReportsCount = g.Count(),
                    HighestPriority = g.Any(x => x.Priority == "urgent") ? "urgent" : (g.Any(x => x.Priority == "high") ? "high" : "normal"),
                    HasUnresolvedUrgent = g.Any(x => x.Priority == "urgent" && x.Status == 0),
                    LatestReportAt = g.Max(x => x.SubmittedAt),
                    Status = 0,
                    ReportsList = g.ToList()
                };
            })
            .OrderByDescending(g => g.HasUnresolvedUrgent)
            .ThenByDescending(g => g.ReportsCount)
            .ToList();

        return groups;
    }

    public async Task<bool> ResolveReportAsync(
        string targetType,
        long reportId,
        long adminId,
        ReportStatus status,
        string? actionTaken,
        string? resolutionNote,
        CancellationToken ct = default)
    {
        switch (targetType.Trim().ToLowerInvariant())
        {
            case "place":
                var placeReport = await _dbContext.PlaceReports.FirstOrDefaultAsync(r => r.Id == reportId, ct);
                if (placeReport == null) return false;
                placeReport.Resolve(adminId, status);
                if (status == ReportStatus.Resolved && actionTaken == "hide_target")
                {
                    var place = await _dbContext.Places.FirstOrDefaultAsync(p => p.Id == placeReport.PlaceId, ct);
                    if (place != null) place.UpdateStatus(PlaceStatus.Hidden);
                }
                break;

            case "review":
                var reviewReport = await _dbContext.ReviewReports.FirstOrDefaultAsync(r => r.Id == reportId, ct);
                if (reviewReport == null) return false;
                reviewReport.Resolve(adminId, status);
                if (status == ReportStatus.Resolved && (actionTaken == "hide_target" || actionTaken == "delete_permanently"))
                {
                    var review = await _dbContext.Reviews.FirstOrDefaultAsync(r => r.Id == reviewReport.ReviewId, ct);
                    if (review != null)
                    {
                        review.UpdateStatus(ReviewStatus.Hidden);
                        await RecalculatePlaceRatingAsync(review.PlaceId, ct);
                    }
                }
                break;

            case "comment":
                var commentReport = await _dbContext.CommentReports.FirstOrDefaultAsync(r => r.Id == reportId, ct);
                if (commentReport == null) return false;
                commentReport.Resolve(adminId, status);
                if (status == ReportStatus.Resolved && actionTaken == "hide_target")
                {
                    var comment = await _dbContext.Comments.FirstOrDefaultAsync(c => c.Id == commentReport.CommentId, ct);
                    if (comment != null) comment.UpdateStatus(CommentStatus.Hidden);
                }
                break;

            case "blog":
                var blogReport = await _dbContext.BlogReports.FirstOrDefaultAsync(r => r.Id == reportId, ct);
                if (blogReport == null) return false;
                blogReport.Resolve(adminId, status);
                if (status == ReportStatus.Resolved && actionTaken == "hide_target")
                {
                    var blog = await _dbContext.Blogs.FirstOrDefaultAsync(b => b.Id == blogReport.BlogId, ct);
                    if (blog != null) blog.UpdateStatus(BlogStatus.Archived);
                }
                break;

            default:
                return false;
        }

        await _dbContext.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> ResolveGroupAsync(
        string targetType,
        long targetId,
        long adminId,
        ReportStatus status,
        string? actionTaken,
        string? resolutionNote,
        CancellationToken ct = default)
    {
        switch (targetType.Trim().ToLowerInvariant())
        {
            case "place":
                var placeReports = await _dbContext.PlaceReports.Where(r => r.PlaceId == targetId && r.Status == ReportStatus.Pending).ToListAsync(ct);
                foreach (var r in placeReports) r.Resolve(adminId, status);
                if (status == ReportStatus.Resolved && actionTaken == "hide_target")
                {
                    var place = await _dbContext.Places.FirstOrDefaultAsync(p => p.Id == targetId, ct);
                    if (place != null) place.UpdateStatus(PlaceStatus.Hidden);
                }
                break;

            case "review":
                var reviewReports = await _dbContext.ReviewReports.Where(r => r.ReviewId == targetId && r.Status == ReportStatus.Pending).ToListAsync(ct);
                foreach (var r in reviewReports) r.Resolve(adminId, status);
                if (status == ReportStatus.Resolved && (actionTaken == "hide_target" || actionTaken == "delete_permanently"))
                {
                    var review = await _dbContext.Reviews.FirstOrDefaultAsync(r => r.Id == targetId, ct);
                    if (review != null)
                    {
                        review.UpdateStatus(ReviewStatus.Hidden);
                        await RecalculatePlaceRatingAsync(review.PlaceId, ct);
                    }
                }
                break;

            case "comment":
                var commentReports = await _dbContext.CommentReports.Where(r => r.CommentId == targetId && r.Status == ReportStatus.Pending).ToListAsync(ct);
                foreach (var r in commentReports) r.Resolve(adminId, status);
                if (status == ReportStatus.Resolved && actionTaken == "hide_target")
                {
                    var comment = await _dbContext.Comments.FirstOrDefaultAsync(c => c.Id == targetId, ct);
                    if (comment != null) comment.UpdateStatus(CommentStatus.Hidden);
                }
                break;

            case "blog":
                var blogReports = await _dbContext.BlogReports.Where(r => r.BlogId == targetId && r.Status == ReportStatus.Pending).ToListAsync(ct);
                foreach (var r in blogReports) r.Resolve(adminId, status);
                if (status == ReportStatus.Resolved && actionTaken == "hide_target")
                {
                    var blog = await _dbContext.Blogs.FirstOrDefaultAsync(b => b.Id == targetId, ct);
                    if (blog != null) blog.UpdateStatus(BlogStatus.Archived);
                }
                break;

            default:
                return false;
        }

        await _dbContext.SaveChangesAsync(ct);
        return true;
    }

    private async Task RecalculatePlaceRatingAsync(long placeId, CancellationToken ct)
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
