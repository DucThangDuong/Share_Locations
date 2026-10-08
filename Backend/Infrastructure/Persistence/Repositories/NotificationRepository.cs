using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using Dapper;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class NotificationRepository : INotificationRepository
{
    private readonly TravelReviewDbContext _dbContext;
    private readonly ICacheService _cacheService;

    public NotificationRepository(TravelReviewDbContext dbContext, ICacheService cacheService)
    {
        _dbContext = dbContext;
        _cacheService = cacheService;
    }

    private static string UnreadCountCacheKey(long userId) => $"notif_unread:{userId}";

    public async Task<NotificationPagedResultDto> GetPagedNotificationsAsync(
        long userId,
        int page,
        int pageSize,
        bool? unreadOnly = null,
        CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();
        var offset = (page - 1) * pageSize;

        const string sql = @"
            -- 1. Lấy danh sách thông báo
            SELECT 
                n.Id,
                n.UserId,
                n.ActorUserId,
                prof.FullName AS ActorName,
                prof.AvatarUrl AS ActorAvatarUrl,
                n.Title,
                n.Content,
                n.Type,
                n.Priority,
                n.GroupKey,
                n.DeduplicationKey,
                n.EntityType,
                n.EntityId,
                n.ReferenceId,
                n.TargetUrl,
                n.IsRead,
                n.ReadAt,
                n.DataJSON,
                n.CreatedAt,
                n.UpdatedAt
            FROM dbo.Notifications n
            LEFT JOIN dbo.UserProfiles prof ON n.ActorUserId = prof.UserId
            WHERE n.UserId = @UserId 
              AND n.ArchivedAt IS NULL
              AND (@UnreadOnly IS NULL OR @UnreadOnly = 0 OR n.IsRead = 0)
            ORDER BY n.CreatedAt DESC
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;

            -- 2. Đếm tổng số lượng bản ghi thỏa mãn điều kiện lọc
            SELECT COUNT(*) 
            FROM dbo.Notifications n
            WHERE n.UserId = @UserId 
              AND n.ArchivedAt IS NULL
              AND (@UnreadOnly IS NULL OR @UnreadOnly = 0 OR n.IsRead = 0);

            -- 3. Đếm số lượng chưa đọc toàn bộ
            SELECT COUNT(*) 
            FROM dbo.Notifications n
            WHERE n.UserId = @UserId 
              AND n.ArchivedAt IS NULL 
              AND n.IsRead = 0;
        ";

        using var multi = await connection.QueryMultipleAsync(new CommandDefinition(
            sql,
            new { UserId = userId, UnreadOnly = unreadOnly, Offset = offset, PageSize = pageSize },
            cancellationToken: ct));

        var items = (await multi.ReadAsync<NotificationDto>()).ToList();
        var totalCount = await multi.ReadFirstAsync<int>();
        var unreadCount = await multi.ReadFirstAsync<int>();

        // Cache unread count
        await _cacheService.SetAsync(UnreadCountCacheKey(userId), unreadCount, TimeSpan.FromSeconds(60), ct);

        return new NotificationPagedResultDto
        {
            Items = items,
            TotalCount = totalCount,
            UnreadCount = unreadCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<int> GetUnreadCountAsync(long userId, CancellationToken ct = default)
    {
        var cacheKey = UnreadCountCacheKey(userId);
        var cached = await _cacheService.GetAsync<int?>(cacheKey, ct);
        if (cached.HasValue)
        {
            return cached.Value;
        }

        var connection = _dbContext.Database.GetDbConnection();
        const string sql = @"
            SELECT COUNT(*) 
            FROM dbo.Notifications 
            WHERE UserId = @UserId 
              AND ArchivedAt IS NULL 
              AND IsRead = 0;";

        var count = await connection.ExecuteScalarAsync<int>(new CommandDefinition(
            sql,
            new { UserId = userId },
            cancellationToken: ct));

        await _cacheService.SetAsync(cacheKey, count, TimeSpan.FromSeconds(60), ct);
        return count;
    }

    public async Task<bool> MarkAsReadAsync(long notificationId, long userId, CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();
        const string sql = @"
            UPDATE dbo.Notifications
            SET IsRead = 1,
                ReadAt = SYSUTCDATETIME(),
                UpdatedAt = SYSUTCDATETIME()
            WHERE Id = @Id AND UserId = @UserId AND IsRead = 0;";

        var rows = await connection.ExecuteAsync(new CommandDefinition(
            sql,
            new { Id = notificationId, UserId = userId },
            cancellationToken: ct));

        await _cacheService.RemoveAsync(UnreadCountCacheKey(userId), ct);
        return rows > 0;
    }

    public async Task<int> MarkAllAsReadAsync(long userId, CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();
        const string sql = @"
            UPDATE dbo.Notifications
            SET IsRead = 1,
                ReadAt = SYSUTCDATETIME(),
                UpdatedAt = SYSUTCDATETIME()
            WHERE UserId = @UserId AND IsRead = 0 AND ArchivedAt IS NULL;";

        var rows = await connection.ExecuteAsync(new CommandDefinition(
            sql,
            new { UserId = userId },
            cancellationToken: ct));

        await _cacheService.SetAsync(UnreadCountCacheKey(userId), 0, TimeSpan.FromSeconds(60), ct);
        return rows;
    }

    public async Task<bool> DeleteOrArchiveAsync(long notificationId, long userId, CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();
        const string sql = @"
            UPDATE dbo.Notifications
            SET ArchivedAt = SYSUTCDATETIME(),
                UpdatedAt = SYSUTCDATETIME()
            WHERE Id = @Id AND UserId = @UserId AND ArchivedAt IS NULL;";

        var rows = await connection.ExecuteAsync(new CommandDefinition(
            sql,
            new { Id = notificationId, UserId = userId },
            cancellationToken: ct));

        await _cacheService.RemoveAsync(UnreadCountCacheKey(userId), ct);
        return rows > 0;
    }

    public async Task<NotificationDto> CreateNotificationAsync(CreateNotificationInput input, CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        // 1. CHỐNG TRÙNG LẶP (Deduplication): Nếu có DeduplicationKey gần nhất trong 60 giây -> bỏ qua, trả về bản ghi cũ
        if (!string.IsNullOrWhiteSpace(input.DeduplicationKey))
        {
            const string dedupSql = @"
                SELECT TOP 1 
                    n.Id, n.UserId, n.ActorUserId, prof.FullName AS ActorName, prof.AvatarUrl AS ActorAvatarUrl,
                    n.Title, n.Content, n.Type, n.Priority, n.GroupKey, n.DeduplicationKey,
                    n.EntityType, n.EntityId, n.ReferenceId, n.TargetUrl, n.IsRead, n.ReadAt,
                    n.DataJSON, n.CreatedAt, n.UpdatedAt
                FROM dbo.Notifications n
                LEFT JOIN dbo.UserProfiles prof ON n.ActorUserId = prof.UserId
                WHERE n.UserId = @UserId 
                  AND n.DeduplicationKey = @DeduplicationKey
                  AND n.CreatedAt >= DATEADD(second, -60, SYSUTCDATETIME());";

            var existingDedup = await connection.QueryFirstOrDefaultAsync<NotificationDto>(new CommandDefinition(
                dedupSql,
                new { input.UserId, input.DeduplicationKey },
                cancellationToken: ct));

            if (existingDedup != null)
            {
                return existingDedup;
            }
        }

        // 2. GOM NHÓM THÔNG BÁO (Aggregation): Nếu có GroupKey và tồn tại bản ghi chưa đọc cùng nhóm trong 24h
        if (!string.IsNullOrWhiteSpace(input.GroupKey))
        {
            const string groupSql = @"
                SELECT TOP 1 
                    n.Id
                FROM dbo.Notifications n
                WHERE n.UserId = @UserId 
                  AND n.GroupKey = @GroupKey
                  AND n.IsRead = 0
                  AND n.ArchivedAt IS NULL
                  AND n.CreatedAt >= DATEADD(hour, -24, SYSUTCDATETIME());";

            var existingId = await connection.ExecuteScalarAsync<long?>(new CommandDefinition(
                groupSql,
                new { input.UserId, input.GroupKey },
                cancellationToken: ct));

            if (existingId.HasValue)
            {
                const string updateGroupSql = @"
                    UPDATE dbo.Notifications
                    SET Title = @Title,
                        Content = @Content,
                        ActorUserId = @ActorUserId,
                        DataJSON = COALESCE(@DataJSON, DataJSON),
                        UpdatedAt = SYSUTCDATETIME()
                    WHERE Id = @Id;

                    SELECT 
                        n.Id, n.UserId, n.ActorUserId, prof.FullName AS ActorName, prof.AvatarUrl AS ActorAvatarUrl,
                        n.Title, n.Content, n.Type, n.Priority, n.GroupKey, n.DeduplicationKey,
                        n.EntityType, n.EntityId, n.ReferenceId, n.TargetUrl, n.IsRead, n.ReadAt,
                        n.DataJSON, n.CreatedAt, n.UpdatedAt
                    FROM dbo.Notifications n
                    LEFT JOIN dbo.UserProfiles prof ON n.ActorUserId = prof.UserId
                    WHERE n.Id = @Id;";

                var updated = await connection.QueryFirstAsync<NotificationDto>(new CommandDefinition(
                    updateGroupSql,
                    new { Id = existingId.Value, input.Title, input.Content, input.ActorUserId, input.DataJSON },
                    cancellationToken: ct));

                await _cacheService.RemoveAsync(UnreadCountCacheKey(input.UserId), ct);
                return updated;
            }
        }

        // 3. TẠO THÔNG BÁO MỚI (INSERT)
        const string insertSql = @"
            INSERT INTO dbo.Notifications (
                UserId, ActorUserId, Title, Content, Type, Priority,
                GroupKey, DeduplicationKey, EntityType, EntityId, ReferenceId,
                TargetUrl, IsRead, DataJSON, ExpiresAt, CreatedAt, UpdatedAt
            )
            OUTPUT 
                INSERTED.Id, INSERTED.UserId, INSERTED.ActorUserId,
                INSERTED.Title, INSERTED.Content, INSERTED.Type, INSERTED.Priority,
                INSERTED.GroupKey, INSERTED.DeduplicationKey, INSERTED.EntityType,
                INSERTED.EntityId, INSERTED.ReferenceId, INSERTED.TargetUrl,
                INSERTED.IsRead, INSERTED.ReadAt, INSERTED.DataJSON,
                INSERTED.CreatedAt, INSERTED.UpdatedAt
            VALUES (
                @UserId, @ActorUserId, @Title, @Content, @Type, @Priority,
                @GroupKey, @DeduplicationKey, @EntityType, @EntityId, @ReferenceId,
                @TargetUrl, 0, @DataJSON, @ExpiresAt, SYSUTCDATETIME(), SYSUTCDATETIME()
            );";

        var inserted = await connection.QueryFirstAsync<NotificationDto>(new CommandDefinition(
            insertSql,
            new
            {
                input.UserId,
                input.ActorUserId,
                input.Title,
                input.Content,
                Type = (byte)input.Type,
                input.Priority,
                input.GroupKey,
                input.DeduplicationKey,
                input.EntityType,
                input.EntityId,
                input.ReferenceId,
                input.TargetUrl,
                input.DataJSON,
                input.ExpiresAt
            },
            cancellationToken: ct));

        // Bổ sung thông tin Actor nếu có
        if (input.ActorUserId.HasValue)
        {
            const string actorSql = "SELECT FullName AS ActorName, AvatarUrl AS ActorAvatarUrl FROM dbo.UserProfiles WHERE UserId = @ActorUserId;";
            var actorInfo = await connection.QueryFirstOrDefaultAsync<(string? ActorName, string? ActorAvatarUrl)>(
                new CommandDefinition(actorSql, new { input.ActorUserId }, cancellationToken: ct));
            inserted.ActorName = actorInfo.ActorName;
            inserted.ActorAvatarUrl = actorInfo.ActorAvatarUrl;
        }

        await _cacheService.RemoveAsync(UnreadCountCacheKey(input.UserId), ct);
        return inserted;
    }
}
