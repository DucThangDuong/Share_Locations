using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs.Admin;
using Dapper;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class AdminAuditLogRepository : IAdminAuditLogRepository
{
    private readonly TravelReviewDbContext _dbContext;
    private readonly ICurrentUserService _currentUserService;

    public AdminAuditLogRepository(
        TravelReviewDbContext dbContext,
        ICurrentUserService currentUserService)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
    }

    public async Task<PagedResult<AdminAuditLogListItemDto>> GetAuditLogsAsync(
        GetAdminAuditLogsRequestDto filter,
        CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();
        var whereClauses = new List<string>();
        var parameters = new DynamicParameters();

        // Kiểm tra phân quyền: CategoryAdmin chỉ xem được nhật ký của chính mình
        if (!_currentUserService.IsSystemAdmin)
        {
            var currentUserId = _currentUserService.UserId ?? 0;
            whereClauses.Add("l.AdminId = @CurrentUserId");
            parameters.Add("CurrentUserId", currentUserId);
        }
        else if (filter.AdminId.HasValue && filter.AdminId.Value > 0)
        {
            whereClauses.Add("l.AdminId = @AdminId");
            parameters.Add("AdminId", filter.AdminId.Value);
        }

        if (!string.IsNullOrWhiteSpace(filter.ActionType))
        {
            whereClauses.Add("l.ActionType = @ActionType");
            parameters.Add("ActionType", filter.ActionType.Trim());
        }

        if (!string.IsNullOrWhiteSpace(filter.TargetTable))
        {
            whereClauses.Add("l.TargetTable = @TargetTable");
            parameters.Add("TargetTable", filter.TargetTable.Trim());
        }

        if (filter.TargetId.HasValue && filter.TargetId.Value > 0)
        {
            whereClauses.Add("l.TargetId = @TargetId");
            parameters.Add("TargetId", filter.TargetId.Value);
        }

        if (filter.FromDate.HasValue)
        {
            whereClauses.Add("l.CreatedAt >= @FromDate");
            parameters.Add("FromDate", filter.FromDate.Value);
        }

        if (filter.ToDate.HasValue)
        {
            whereClauses.Add("l.CreatedAt <= @ToDate");
            parameters.Add("ToDate", filter.ToDate.Value);
        }

        if (!string.IsNullOrWhiteSpace(filter.Keyword))
        {
            whereClauses.Add("(l.Reason LIKE @Keyword OR l.ActionType LIKE @Keyword OR up.FullName LIKE @Keyword OR u.Email LIKE @Keyword OR l.IpAddress LIKE @Keyword)");
            parameters.Add("Keyword", $"%{filter.Keyword.Trim()}%");
        }

        var whereSql = whereClauses.Count > 0 ? " WHERE " + string.Join(" AND ", whereClauses) : "";

        var countSql = $@"
            SELECT COUNT(1)
            FROM dbo.AdminActionLogs l
            LEFT JOIN dbo.Users u ON l.AdminId = u.Id
            LEFT JOIN dbo.UserProfiles up ON u.Id = up.UserId
            {whereSql};";

        var totalCount = await connection.ExecuteScalarAsync<int>(countSql, parameters);

        var page = filter.Page > 0 ? filter.Page : 1;
        var pageSize = filter.PageSize > 0 ? filter.PageSize : 20;
        var offset = (page - 1) * pageSize;

        parameters.Add("Offset", offset);
        parameters.Add("PageSize", pageSize);

        var dataSql = $@"
            SELECT 
                l.Id,
                l.AdminId,
                ISNULL(up.FullName, u.Email) AS AdminName,
                u.Email AS AdminEmail,
                up.AvatarUrl AS AdminAvatar,
                l.ActorRoleCode,
                l.ActionType,
                l.TargetTable,
                l.TargetId,
                ISNULL(l.Reason, l.TargetTable + ' #' + CAST(l.TargetId AS NVARCHAR)) AS TargetName,
                l.ActionStatus,
                l.Reason,
                l.IpAddress,
                l.CreatedAt
            FROM dbo.AdminActionLogs l
            LEFT JOIN dbo.Users u ON l.AdminId = u.Id
            LEFT JOIN dbo.UserProfiles up ON u.Id = up.UserId
            {whereSql}
            ORDER BY l.CreatedAt DESC
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;";

        var items = (await connection.QueryAsync<AdminAuditLogListItemDto>(dataSql, parameters)).ToList();

        return new PagedResult<AdminAuditLogListItemDto>(items, totalCount, page, pageSize);
    }

    public async Task<AdminAuditLogDetailDto?> GetAuditLogDetailAsync(
        long id,
        CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        const string sql = @"
            SELECT 
                l.Id,
                l.AdminId,
                ISNULL(up.FullName, u.Email) AS AdminName,
                u.Email AS AdminEmail,
                up.AvatarUrl AS AdminAvatar,
                l.ActorRoleCode,
                l.ActionType,
                l.TargetTable,
                l.TargetId,
                ISNULL(l.Reason, l.TargetTable + ' #' + CAST(l.TargetId AS NVARCHAR)) AS TargetName,
                l.ActionStatus,
                l.Reason,
                l.OldDataJSON,
                l.NewDataJSON,
                l.MetadataJSON,
                l.RequestId,
                l.IpAddress,
                l.UserAgent,
                l.CreatedAt
            FROM dbo.AdminActionLogs l
            LEFT JOIN dbo.Users u ON l.AdminId = u.Id
            LEFT JOIN dbo.UserProfiles up ON u.Id = up.UserId
            WHERE l.Id = @Id;";

        var detail = await connection.QueryFirstOrDefaultAsync<AdminAuditLogDetailDto>(sql, new { Id = id });
        if (detail == null) return null;

        // Nếu là CategoryAdmin, chỉ được xem log của chính mình
        if (!_currentUserService.IsSystemAdmin && detail.AdminId != _currentUserService.UserId)
        {
            return null;
        }

        return detail;
    }
}
