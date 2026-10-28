using System.Data;
using Application.Common;
using Application.Common.Interfaces;
using Application.DTOs;
using Dapper;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

public class ReputationService : IReputationService
{
    private readonly TravelReviewDbContext _dbContext;
    private readonly ILogger<ReputationService> _logger;

    private const int DailyCap = 50;

    private static readonly HashSet<string> DailyCappedActions = new(StringComparer.OrdinalIgnoreCase)
    {
        nameof(ReputationActionType.ReviewCreated),
        nameof(ReputationActionType.ReviewWithMediaCreated),
        nameof(ReputationActionType.TripCreated),
        nameof(ReputationActionType.VisitLogCreated),
        nameof(ReputationActionType.ReviewLiked)
    };

    public ReputationService(
        TravelReviewDbContext dbContext,
        ILogger<ReputationService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<ReputationAwardResult> AwardPointsAsync(
        long userId,
        ReputationActionType actionType,
        long? entityId = null,
        string? description = null,
        CancellationToken ct = default)
    {
        if (userId <= 0)
        {
            return ReputationAwardResult.Skipped("User ID không hợp lệ.");
        }

        var (basePoints, defaultDescription) = GetActionMetadata(actionType);
        var finalDescription = !string.IsNullOrWhiteSpace(description) ? description.Trim() : defaultDescription;
        var actionTypeName = actionType.ToString();

        var connection = _dbContext.Database.GetDbConnection();
        if (connection.State != ConnectionState.Open)
        {
            await connection.OpenAsync(ct);
        }

        // 1. Kiểm tra tính lũy kế trùng lặp (Idempotency)
        if (entityId.HasValue && entityId.Value > 0)
        {
            const string checkDuplicateSql = @"
                SELECT COUNT(1) 
                FROM dbo.ReputationLogs 
                WHERE UserId = @UserId AND ActionType = @ActionType AND EntityId = @EntityId;";

            var existingCount = await connection.ExecuteScalarAsync<int>(checkDuplicateSql, new
            {
                UserId = userId,
                ActionType = actionTypeName,
                EntityId = entityId.Value
            });

            if (existingCount > 0)
            {
                _logger.LogInformation("Reputation action {ActionType} for user {UserId} and entity {EntityId} already awarded. Skipping.",
                    actionTypeName, userId, entityId);
                return ReputationAwardResult.Skipped("Hành động này đã được cộng điểm uy tín trước đó.");
            }
        }

        // 2. Kiểm tra giới hạn điểm trong ngày (Daily Cap)
        var pointsToAward = basePoints;
        var isCapped = DailyCappedActions.Contains(actionTypeName);

        if (isCapped)
        {
            var startOfDayUtc = DateTime.UtcNow.Date;
            const string checkTodaySql = @"
                SELECT ISNULL(SUM(Points), 0)
                FROM dbo.ReputationLogs
                WHERE UserId = @UserId 
                  AND ActionType IN @CappedActions
                  AND CreatedAt >= @StartOfDay
                  AND Points > 0;";

            var pointsEarnedToday = await connection.ExecuteScalarAsync<int>(checkTodaySql, new
            {
                UserId = userId,
                CappedActions = DailyCappedActions.ToArray(),
                StartOfDay = startOfDayUtc
            });

            if (pointsEarnedToday >= DailyCap)
            {
                _logger.LogInformation("User {UserId} reached daily reputation cap ({Cap} pts). Skipping action {ActionType}.",
                    userId, DailyCap, actionTypeName);
                return ReputationAwardResult.Skipped($"Bạn đã đạt hạn mức tối đa {DailyCap} điểm uy tín trong ngày.");
            }

            pointsToAward = Math.Min(basePoints, DailyCap - pointsEarnedToday);
        }

        if (pointsToAward <= 0)
        {
            return ReputationAwardResult.Skipped("Số điểm cộng bằng 0 do đạt hạn mức ngày.");
        }

        // 3. Thực hiện cập nhật số dư và ghi log nguyên tử (Atomic Transaction)
        using var transaction = await _dbContext.Database.BeginTransactionAsync(ct);
        try
        {
            const string updateProfileSql = @"
                UPDATE dbo.UserProfiles
                SET ReputationScore = ReputationScore + @Points,
                    RankLevel = CASE 
                        WHEN RankLevel LIKE N'Quản trị viên%' THEN RankLevel
                        WHEN ReputationScore + @Points >= 2500 THEN N'Chuyên gia du lịch'
                        WHEN ReputationScore + @Points >= 1200 THEN N'Thổ địa du lịch'
                        WHEN ReputationScore + @Points >= 300 THEN N'Nhà khám phá'
                        ELSE N'Tân binh'
                    END,
                    UpdatedAt = SYSUTCDATETIME()
                OUTPUT 
                    deleted.RankLevel AS OldRankLevel,
                    inserted.ReputationScore AS NewScore,
                    inserted.RankLevel AS NewRankLevel
                WHERE UserId = @UserId;";

            var resultRow = await connection.QuerySingleOrDefaultAsync(updateProfileSql, new
            {
                Points = pointsToAward,
                UserId = userId
            }, transaction: transaction.GetDbTransaction());

            if (resultRow == null)
            {
                await transaction.RollbackAsync(ct);
                return ReputationAwardResult.Skipped("Không tìm thấy thông tin hồ sơ người dùng.");
            }

            string oldRank = (string)resultRow.OldRankLevel;
            int newScore = (int)resultRow.NewScore;
            string newRank = (string)resultRow.NewRankLevel;
            bool rankedUp = !string.Equals(oldRank, newRank, StringComparison.OrdinalIgnoreCase) && !oldRank.StartsWith("Quản trị viên", StringComparison.OrdinalIgnoreCase);

            const string insertLogSql = @"
                INSERT INTO dbo.ReputationLogs (UserId, ActionType, Points, BalanceAfter, EntityId, Description, CreatedAt)
                VALUES (@UserId, @ActionType, @Points, @BalanceAfter, @EntityId, @Description, SYSUTCDATETIME());";

            await connection.ExecuteAsync(insertLogSql, new
            {
                UserId = userId,
                ActionType = actionTypeName,
                Points = pointsToAward,
                BalanceAfter = newScore,
                EntityId = entityId,
                Description = finalDescription
            }, transaction: transaction.GetDbTransaction());

            await transaction.CommitAsync(ct);

            _logger.LogInformation("Awarded {Points} reputation points to user {UserId} for {ActionType}. New score: {NewScore}, Rank: {NewRank}",
                pointsToAward, userId, actionTypeName, newScore, newRank);

            var message = rankedUp
                ? $"Chúc mừng! Bạn nhận được +{pointsToAward} điểm uy tín và đã thăng hạng lên '{newRank}'!"
                : $"Bạn nhận được +{pointsToAward} điểm uy tín.";

            return ReputationAwardResult.Success(pointsToAward, newScore, newRank, rankedUp, message);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(ct);
            _logger.LogError(ex, "Failed to award reputation points to user {UserId} for {ActionType}", userId, actionTypeName);
            return ReputationAwardResult.Skipped("Lỗi hệ thống khi cập nhật điểm uy tín.");
        }
    }

    public async Task<bool> DeductPointsAsync(
        long userId,
        ReputationActionType actionType,
        int points,
        long? entityId = null,
        string? reason = null,
        CancellationToken ct = default)
    {
        if (userId <= 0 || points <= 0) return false;

        var actionTypeName = actionType.ToString();
        var (_, defaultDescription) = GetActionMetadata(actionType);
        var finalDescription = !string.IsNullOrWhiteSpace(reason) ? reason.Trim() : defaultDescription;

        var connection = _dbContext.Database.GetDbConnection();
        if (connection.State != ConnectionState.Open)
        {
            await connection.OpenAsync(ct);
        }

        using var transaction = await _dbContext.Database.BeginTransactionAsync(ct);
        try
        {
            const string deductProfileSql = @"
                UPDATE dbo.UserProfiles
                SET ReputationScore = CASE WHEN ReputationScore - @Points < 0 THEN 0 ELSE ReputationScore - @Points END,
                    RankLevel = CASE 
                        WHEN RankLevel LIKE N'Quản trị viên%' THEN RankLevel
                        WHEN CASE WHEN ReputationScore - @Points < 0 THEN 0 ELSE ReputationScore - @Points END >= 2500 THEN N'Chuyên gia du lịch'
                        WHEN CASE WHEN ReputationScore - @Points < 0 THEN 0 ELSE ReputationScore - @Points END >= 1200 THEN N'Thổ địa du lịch'
                        WHEN CASE WHEN ReputationScore - @Points < 0 THEN 0 ELSE ReputationScore - @Points END >= 300 THEN N'Nhà khám phá'
                        ELSE N'Tân binh'
                    END,
                    UpdatedAt = SYSUTCDATETIME()
                OUTPUT inserted.ReputationScore AS NewScore
                WHERE UserId = @UserId;";

            var newScoreObj = await connection.ExecuteScalarAsync<int?>(deductProfileSql, new
            {
                Points = points,
                UserId = userId
            }, transaction: transaction.GetDbTransaction());

            if (!newScoreObj.HasValue)
            {
                await transaction.RollbackAsync(ct);
                return false;
            }

            const string insertLogSql = @"
                INSERT INTO dbo.ReputationLogs (UserId, ActionType, Points, BalanceAfter, EntityId, Description, CreatedAt)
                VALUES (@UserId, @ActionType, @Points, @BalanceAfter, @EntityId, @Description, SYSUTCDATETIME());";

            await connection.ExecuteAsync(insertLogSql, new
            {
                UserId = userId,
                ActionType = actionTypeName,
                Points = -points,
                BalanceAfter = newScoreObj.Value,
                EntityId = entityId,
                Description = finalDescription
            }, transaction: transaction.GetDbTransaction());

            await transaction.CommitAsync(ct);
            return true;
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(ct);
            _logger.LogError(ex, "Failed to deduct reputation points from user {UserId}", userId);
            return false;
        }
    }

    public async Task<PagedResult<ReputationLogDto>> GetUserHistoryAsync(
        long userId,
        int page,
        int pageSize,
        CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();
        if (connection.State != ConnectionState.Open)
        {
            await connection.OpenAsync(ct);
        }

        const string countSql = "SELECT COUNT(1) FROM dbo.ReputationLogs WHERE UserId = @UserId;";
        var totalCount = await connection.ExecuteScalarAsync<long>(countSql, new { UserId = userId });

        if (totalCount == 0)
        {
            return new PagedResult<ReputationLogDto>(Array.Empty<ReputationLogDto>(), 0, page, pageSize);
        }

        var offset = Math.Max(0, (page - 1) * pageSize);
        const string selectSql = @"
            SELECT 
                Id,
                ActionType,
                Points,
                BalanceAfter,
                EntityId,
                Description,
                CreatedAt
            FROM dbo.ReputationLogs
            WHERE UserId = @UserId
            ORDER BY CreatedAt DESC
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;";

        var rows = await connection.QueryAsync(selectSql, new
        {
            UserId = userId,
            Offset = offset,
            PageSize = pageSize
        });

        var items = rows.Select(r => new ReputationLogDto
        {
            Id = (long)r.Id,
            ActionType = (string)r.ActionType,
            ActionName = GetFriendlyActionName((string)r.ActionType),
            Points = (int)r.Points,
            BalanceAfter = (int)r.BalanceAfter,
            EntityId = (long?)r.EntityId,
            Description = (string?)r.Description,
            CreatedAt = (DateTime)r.CreatedAt
        }).ToList();

        return new PagedResult<ReputationLogDto>(items, totalCount, page, pageSize);
    }

    private static (int Points, string Description) GetActionMetadata(ReputationActionType actionType) => actionType switch
    {
        ReputationActionType.ReviewCreated => (15, "Đánh giá địa điểm"),
        ReputationActionType.ReviewWithMediaCreated => (25, "Đánh giá địa điểm kèm hình ảnh/video"),
        ReputationActionType.ProposalApprovedNewPlace => (50, "Đề xuất địa điểm mới được phê duyệt"),
        ReputationActionType.ProposalApprovedEditPlace => (15, "Đóng góp thông tin địa điểm được phê duyệt"),
        ReputationActionType.TripCreated => (30, "Tạo lịch trình du lịch công khai"),
        ReputationActionType.BlogPublished => (40, "Xuất bản bài viết blog du lịch"),
        ReputationActionType.VisitLogCreated => (5, "Ghé thăm và check-in địa điểm"),
        ReputationActionType.ReviewLiked => (2, "Đánh giá nhận được lượt thích hữu ích"),
        ReputationActionType.ReviewUnliked => (-2, "Hủy lượt thích đánh giá"),
        ReputationActionType.ReviewRemovedViolation => (-30, "Trừ điểm do đánh giá vi phạm tiêu chuẩn"),
        _ => (0, "Biến động điểm uy tín")
    };

    private static string GetFriendlyActionName(string actionType)
    {
        if (Enum.TryParse<ReputationActionType>(actionType, true, out var parsed))
        {
            return GetActionMetadata(parsed).Description;
        }
        return "Biến động điểm uy tín";
    }
}
