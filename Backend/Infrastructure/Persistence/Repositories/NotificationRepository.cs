using System.Text.RegularExpressions;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using Dapper;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class NotificationRepository : INotificationRepository
{
    private static readonly Regex ReviewUrlRegex = new(@"^/reviews?/(\d+)(?:[/?#].*)?$", RegexOptions.IgnoreCase | RegexOptions.Compiled);
    private static readonly Regex ChatRoomQueryRegex = new(@"^/chat\?room=(\d+)$", RegexOptions.IgnoreCase | RegexOptions.Compiled);
    private static readonly Regex ValidRouteRegex = new(
        @"^(/|/(explore|diadiem)|/(places|dia-diem)/[^/]+|/map|/(itinerary|my-trips|itineraries|hanh-trinh|trips|trip|chuyen-di)(/[^/]+)?|/(blog|cam-nang)(/[^/]+)?|/(regions|mien)(/[^/]+)?|/(provinces|province|tinh-thanh)(/[^/]+)?|/tinh/[^/]+|/(rankings|bang-xep-hang|bxh|leaderboard)|/(propose-place|de-xuat|de-xuat-dia-diem)|/(profile|trang-ca-nhan)(/[^/]+)?|/(user|users|u)/[^/]+|/(settings|cai-dat)|/chat|/(directions|chi-duong)|/admin(/.*)?)$",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private readonly TravelReviewDbContext _dbContext;
    private readonly ICacheService _cacheService;

    public NotificationRepository(TravelReviewDbContext dbContext, ICacheService cacheService)
    {
        _dbContext = dbContext;
        _cacheService = cacheService;
    }

    private static string UnreadCountCacheKey(long userId) => $"notif_unread:{userId}";

    private static long? TryExtractReviewId(string? url, string? entityType, long? entityId, long? referenceId)
    {
        if (!string.IsNullOrWhiteSpace(url))
        {
            var match = ReviewUrlRegex.Match(url.Trim());
            if (match.Success && long.TryParse(match.Groups[1].Value, out var parsedId))
            {
                return parsedId;
            }
        }

        if (string.Equals(entityType, "REVIEW", StringComparison.OrdinalIgnoreCase))
        {
            return entityId ?? referenceId;
        }

        return null;
    }

    private static string? FallbackUrlByType(NotificationType type, long? actorUserId, long? entityId)
    {
        return type switch
        {
            NotificationType.System => "/explore",
            NotificationType.Social => actorUserId.HasValue ? $"/profile/{actorUserId.Value}" : "/profile",
            NotificationType.Review => "/profile?tab=reviews",
            NotificationType.Trip => entityId.HasValue ? $"/itinerary/{entityId.Value}" : "/itinerary",
            NotificationType.Proposal => "/profile?tab=proposals",
            NotificationType.Moderation => "/settings",
            _ => null
        };
    }

    private static string? NormalizeTargetUrl(
        string? rawUrl,
        NotificationType type,
        long? actorUserId,
        string? entityType,
        long? entityId,
        long? referenceId,
        IReadOnlyDictionary<long, long>? reviewPlaceMap)
    {
        var trimmed = rawUrl?.Trim();
        if (string.IsNullOrWhiteSpace(trimmed))
        {
            return FallbackUrlByType(type, actorUserId, entityId);
        }

        var normalized = trimmed;

        var reviewMatch = ReviewUrlRegex.Match(normalized);
        if (reviewMatch.Success)
        {
            var reviewId = TryExtractReviewId(normalized, entityType, entityId, referenceId);
            if (reviewId.HasValue && reviewPlaceMap != null && reviewPlaceMap.TryGetValue(reviewId.Value, out var placeId))
            {
                return $"/places/{placeId}#review-{reviewId.Value}";
            }
            return "/profile?tab=reviews";
        }

        if (normalized.StartsWith("/account", StringComparison.OrdinalIgnoreCase))
        {
            return "/settings";
        }

        var chatRoomMatch = ChatRoomQueryRegex.Match(normalized);
        if (chatRoomMatch.Success)
        {
            return $"/chat?conversation={chatRoomMatch.Groups[1].Value}";
        }

        if (normalized.StartsWith("/trips/", StringComparison.OrdinalIgnoreCase))
        {
            normalized = "/itinerary/" + normalized[7..];
        }
        else if (normalized.StartsWith("/trip/", StringComparison.OrdinalIgnoreCase))
        {
            normalized = "/itinerary/" + normalized[6..];
        }
        else if (normalized.StartsWith("/blogs/", StringComparison.OrdinalIgnoreCase))
        {
            normalized = "/blog/" + normalized[7..];
        }
        else if (string.Equals(normalized, "/blogs", StringComparison.OrdinalIgnoreCase))
        {
            normalized = "/blog";
        }
        else if (normalized.StartsWith("/proposals", StringComparison.OrdinalIgnoreCase))
        {
            normalized = "/profile?tab=proposals";
        }
        else if (normalized.StartsWith("/friends", StringComparison.OrdinalIgnoreCase))
        {
            normalized = actorUserId.HasValue ? $"/profile/{actorUserId.Value}" : "/profile";
        }
        else if (normalized.StartsWith("/place/", StringComparison.OrdinalIgnoreCase))
        {
            normalized = "/places/" + normalized[7..];
        }
        else if (string.Equals(normalized, "/places", StringComparison.OrdinalIgnoreCase))
        {
            normalized = "/explore";
        }

        var pathOnly = normalized.Split('?', '#')[0];
        if (pathOnly.Length > 1 && pathOnly.EndsWith('/'))
        {
            pathOnly = pathOnly.TrimEnd('/');
        }

        if (ValidRouteRegex.IsMatch(pathOnly))
        {
            return normalized;
        }

        return FallbackUrlByType(type, actorUserId, entityId);
    }

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

            SELECT COUNT(*)
            FROM dbo.Notifications n
            WHERE n.UserId = @UserId
              AND n.ArchivedAt IS NULL
              AND (@UnreadOnly IS NULL OR @UnreadOnly = 0 OR n.IsRead = 0);

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

        var reviewIdsToResolve = items
            .Where(i => !string.IsNullOrWhiteSpace(i.TargetUrl) && ReviewUrlRegex.IsMatch(i.TargetUrl.Trim()))
            .Select(i => TryExtractReviewId(i.TargetUrl, i.EntityType, i.EntityId, i.ReferenceId))
            .Where(id => id.HasValue)
            .Select(id => id!.Value)
            .Distinct()
            .ToList();

        Dictionary<long, long>? reviewPlaceMap = null;
        if (reviewIdsToResolve.Count > 0)
        {
            const string reviewLookupSql = "SELECT Id, PlaceId FROM dbo.Reviews WHERE Id IN @Ids;";
            var rows = await connection.QueryAsync<(long Id, long PlaceId)>(new CommandDefinition(
                reviewLookupSql,
                new { Ids = reviewIdsToResolve },
                cancellationToken: ct));
            reviewPlaceMap = rows.ToDictionary(r => r.Id, r => r.PlaceId);
        }

        foreach (var item in items)
        {
            item.TargetUrl = NormalizeTargetUrl(
                item.TargetUrl,
                item.Type,
                item.ActorUserId,
                item.EntityType,
                item.EntityId,
                item.ReferenceId,
                reviewPlaceMap);
        }

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

        Dictionary<long, long>? reviewPlaceMap = null;
        var reviewId = TryExtractReviewId(input.TargetUrl, input.EntityType, input.EntityId, input.ReferenceId);
        if (reviewId.HasValue && !string.IsNullOrWhiteSpace(input.TargetUrl) && ReviewUrlRegex.IsMatch(input.TargetUrl.Trim()))
        {
            const string reviewSql = "SELECT TOP 1 PlaceId FROM dbo.Reviews WHERE Id = @Id;";
            var placeId = await connection.ExecuteScalarAsync<long?>(new CommandDefinition(
                reviewSql,
                new { Id = reviewId.Value },
                cancellationToken: ct));
            if (placeId.HasValue)
            {
                reviewPlaceMap = new Dictionary<long, long> { [reviewId.Value] = placeId.Value };
            }
        }

        input.TargetUrl = NormalizeTargetUrl(
            input.TargetUrl,
            input.Type,
            input.ActorUserId,
            input.EntityType,
            input.EntityId,
            input.ReferenceId,
            reviewPlaceMap);

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
                existingDedup.TargetUrl = NormalizeTargetUrl(
                    existingDedup.TargetUrl,
                    existingDedup.Type,
                    existingDedup.ActorUserId,
                    existingDedup.EntityType,
                    existingDedup.EntityId,
                    existingDedup.ReferenceId,
                    reviewPlaceMap);
                return existingDedup;
            }
        }

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
                        TargetUrl = COALESCE(@TargetUrl, TargetUrl),
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
                    new { Id = existingId.Value, input.Title, input.Content, input.ActorUserId, input.TargetUrl, input.DataJSON },
                    cancellationToken: ct));

                updated.TargetUrl = NormalizeTargetUrl(
                    updated.TargetUrl,
                    updated.Type,
                    updated.ActorUserId,
                    updated.EntityType,
                    updated.EntityId,
                    updated.ReferenceId,
                    reviewPlaceMap);

                await _cacheService.RemoveAsync(UnreadCountCacheKey(input.UserId), ct);
                return updated;
            }
        }

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
