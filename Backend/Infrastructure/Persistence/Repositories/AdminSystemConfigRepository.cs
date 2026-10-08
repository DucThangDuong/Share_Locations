using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs.Admin;
using Dapper;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class AdminSystemConfigRepository : IAdminSystemConfigRepository
{
    private readonly TravelReviewDbContext _dbContext;
    private readonly IAuditLogService _auditLogService;

    public AdminSystemConfigRepository(
        TravelReviewDbContext dbContext,
        IAuditLogService auditLogService)
    {
        _dbContext = dbContext;
        _auditLogService = auditLogService;
    }

    // ==========================================
    // 1. REPORT TYPES
    // ==========================================

    public async Task<IReadOnlyList<AdminReportTypeListItemDto>> GetReportTypesAsync(string? targetScope = null, bool? activeOnly = null, CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        var sql = @"
            SELECT 
                rt.Id,
                rt.Code,
                rt.Name,
                rt.TargetScope,
                rt.IsActive,
                rt.DisplayOrder,
                (
                    (SELECT COUNT(1) FROM dbo.PlaceReports pr WHERE pr.ReportTypeId = rt.Id) +
                    (SELECT COUNT(1) FROM dbo.ReviewReports rr WHERE rr.ReportTypeId = rt.Id) +
                    (SELECT COUNT(1) FROM dbo.CommentReports cr WHERE cr.ReportTypeId = rt.Id) +
                    (SELECT COUNT(1) FROM dbo.BlogReports br WHERE br.ReportTypeId = rt.Id)
                ) AS TotalReportsCount
            FROM dbo.ReportTypes rt
            WHERE (@TargetScope IS NULL OR rt.TargetScope = @TargetScope OR rt.TargetScope = 'ALL')
              AND (@ActiveOnly IS NULL OR (@ActiveOnly = 1 AND rt.IsActive = 1))
            ORDER BY rt.DisplayOrder, rt.Id;";

        var items = await connection.QueryAsync<AdminReportTypeListItemDto>(sql, new { TargetScope = targetScope, ActiveOnly = activeOnly });
        return items.ToList();
    }

    public async Task<AdminReportTypeListItemDto?> GetReportTypeByIdAsync(int id, CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        const string sql = @"
            SELECT 
                rt.Id,
                rt.Code,
                rt.Name,
                rt.TargetScope,
                rt.IsActive,
                rt.DisplayOrder,
                (
                    (SELECT COUNT(1) FROM dbo.PlaceReports pr WHERE pr.ReportTypeId = rt.Id) +
                    (SELECT COUNT(1) FROM dbo.ReviewReports rr WHERE rr.ReportTypeId = rt.Id) +
                    (SELECT COUNT(1) FROM dbo.CommentReports cr WHERE cr.ReportTypeId = rt.Id) +
                    (SELECT COUNT(1) FROM dbo.BlogReports br WHERE br.ReportTypeId = rt.Id)
                ) AS TotalReportsCount
            FROM dbo.ReportTypes rt
            WHERE rt.Id = @Id;";

        return await connection.QueryFirstOrDefaultAsync<AdminReportTypeListItemDto>(sql, new { Id = id });
    }

    public async Task<int> CreateReportTypeAsync(CreateAdminReportTypeRequest input, long adminId, CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        var code = input.Code.Trim().ToUpperInvariant();
        var name = input.Name.Trim();
        var scope = string.IsNullOrWhiteSpace(input.TargetScope) ? "ALL" : input.TargetScope.Trim().ToUpperInvariant();

        const string checkSql = "SELECT COUNT(1) FROM dbo.ReportTypes WHERE Code = @Code;";
        var exists = await connection.ExecuteScalarAsync<int>(checkSql, new { Code = code });
        if (exists > 0)
        {
            throw new InvalidOperationException($"Mã lý do báo cáo '{code}' đã tồn tại.");
        }

        const string insertSql = @"
            INSERT INTO dbo.ReportTypes (Code, Name, TargetScope, IsActive, DisplayOrder)
            VALUES (@Code, @Name, @TargetScope, @IsActive, @DisplayOrder);
            SELECT CAST(SCOPE_IDENTITY() AS INT);";

        var newId = await connection.ExecuteScalarAsync<int>(insertSql, new
        {
            Code = code,
            Name = name,
            TargetScope = scope,
            IsActive = input.IsActive,
            DisplayOrder = input.DisplayOrder
        });

        await _auditLogService.LogAsync(
            actionType: "CREATE_REPORT_TYPE",
            targetTable: "ReportTypes",
            targetId: newId,
            reason: $"Thêm mới lý do báo cáo: {name} ({code})",
            newData: new
            {
                Code = code,
                Name = name,
                TargetScope = scope,
                IsActive = input.IsActive,
                DisplayOrder = input.DisplayOrder
            },
            customAdminId: adminId,
            ct: ct);

        return newId;
    }

    public async Task<bool> UpdateReportTypeAsync(int id, UpdateAdminReportTypeRequest input, long adminId, CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        const string selectSql = "SELECT Id, Code, Name, TargetScope, IsActive, DisplayOrder FROM dbo.ReportTypes WHERE Id = @Id;";
        var old = await connection.QueryFirstOrDefaultAsync(selectSql, new { Id = id });
        if (old == null) return false;

        var name = input.Name.Trim();
        var scope = string.IsNullOrWhiteSpace(input.TargetScope) ? "ALL" : input.TargetScope.Trim().ToUpperInvariant();

        const string updateSql = @"
            UPDATE dbo.ReportTypes
            SET Name = @Name,
                TargetScope = @TargetScope,
                IsActive = @IsActive,
                DisplayOrder = @DisplayOrder
            WHERE Id = @Id;";

        var rows = await connection.ExecuteAsync(updateSql, new
        {
            Id = id,
            Name = name,
            TargetScope = scope,
            IsActive = input.IsActive,
            DisplayOrder = input.DisplayOrder
        });

        if (rows > 0)
        {
            await _auditLogService.LogAsync(
                actionType: "UPDATE_REPORT_TYPE",
                targetTable: "ReportTypes",
                targetId: id,
                reason: $"Cập nhật lý do báo cáo: {name}",
                oldData: old,
                newData: new
                {
                    Name = name,
                    TargetScope = scope,
                    IsActive = input.IsActive,
                    DisplayOrder = input.DisplayOrder
                },
                customAdminId: adminId,
                ct: ct);

            return true;
        }

        return false;
    }

    public async Task<bool> UpdateReportTypeStatusAsync(int id, bool isActive, long adminId, CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        const string selectSql = "SELECT Id, Name, IsActive FROM dbo.ReportTypes WHERE Id = @Id;";
        var old = await connection.QueryFirstOrDefaultAsync(selectSql, new { Id = id });
        if (old == null) return false;

        const string updateSql = "UPDATE dbo.ReportTypes SET IsActive = @IsActive WHERE Id = @Id;";
        var rows = await connection.ExecuteAsync(updateSql, new { Id = id, IsActive = isActive });

        if (rows > 0)
        {
            var actionText = isActive ? "Kích hoạt lý do báo cáo" : "Tạm ẩn lý do báo cáo";
            await _auditLogService.LogAsync(
                actionType: "CHANGE_REPORT_TYPE_STATUS",
                targetTable: "ReportTypes",
                targetId: id,
                reason: $"{actionText}: {old.Name}",
                oldData: new { IsActive = old.IsActive },
                newData: new { IsActive = isActive },
                customAdminId: adminId,
                ct: ct);

            return true;
        }

        return false;
    }

    public async Task<(bool Success, string? ErrorMessage)> DeleteReportTypeAsync(int id, long adminId, CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        const string selectSql = "SELECT Id, Code, Name, IsActive FROM dbo.ReportTypes WHERE Id = @Id;";
        var old = await connection.QueryFirstOrDefaultAsync(selectSql, new { Id = id });
        if (old == null) return (false, "Không tìm thấy lý do báo cáo cần xóa.");

        const string checkSql = @"
            SELECT 
                (SELECT COUNT(1) FROM dbo.PlaceReports WHERE ReportTypeId = @Id) +
                (SELECT COUNT(1) FROM dbo.ReviewReports WHERE ReportTypeId = @Id) +
                (SELECT COUNT(1) FROM dbo.CommentReports WHERE ReportTypeId = @Id) +
                (SELECT COUNT(1) FROM dbo.BlogReports WHERE ReportTypeId = @Id);";

        var count = await connection.ExecuteScalarAsync<int>(checkSql, new { Id = id });
        if (count > 0)
        {
            return (false, $"Không thể xóa lý do '{old.Name}' vì đã có {count} báo cáo vi phạm liên kết. Vui lòng chuyển trạng thái sang Tắt kích hoạt.");
        }

        const string deleteSql = "DELETE FROM dbo.ReportTypes WHERE Id = @Id;";
        await connection.ExecuteAsync(deleteSql, new { Id = id });

        await _auditLogService.LogAsync(
            actionType: "DELETE_REPORT_TYPE",
            targetTable: "ReportTypes",
            targetId: id,
            reason: $"Xóa lý do báo cáo: {old.Name}",
            oldData: old,
            newData: null,
            customAdminId: adminId,
            ct: ct);

        return (true, null);
    }

    // ==========================================
    // 2. SYSTEM SETTINGS
    // ==========================================

    public async Task<IReadOnlyList<AdminSystemSettingDto>> GetSystemSettingsAsync(string? group = null, CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        var sql = @"
            SELECT 
                s.Id,
                s.SettingKey,
                s.SettingValue,
                s.SettingGroup,
                s.Description,
                s.UpdatedAt,
                s.UpdatedBy,
                prof.FullName AS UpdatedByName
            FROM dbo.SystemSettings s
            LEFT JOIN dbo.UserProfiles prof ON s.UpdatedBy = prof.UserId
            WHERE (@Group IS NULL OR s.SettingGroup = @Group)
            ORDER BY s.SettingGroup, s.SettingKey;";

        var items = await connection.QueryAsync<AdminSystemSettingDto>(sql, new { Group = group });
        return items.ToList();
    }

    public async Task<AdminSystemSettingDto?> GetSystemSettingByKeyAsync(string key, CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        const string sql = @"
            SELECT 
                s.Id,
                s.SettingKey,
                s.SettingValue,
                s.SettingGroup,
                s.Description,
                s.UpdatedAt,
                s.UpdatedBy,
                prof.FullName AS UpdatedByName
            FROM dbo.SystemSettings s
            LEFT JOIN dbo.UserProfiles prof ON s.UpdatedBy = prof.UserId
            WHERE s.SettingKey = @Key;";

        return await connection.QueryFirstOrDefaultAsync<AdminSystemSettingDto>(sql, new { Key = key.Trim().ToUpperInvariant() });
    }

    public async Task<bool> UpdateSystemSettingAsync(string key, string value, string? description, long adminId, CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();
        var upperKey = key.Trim().ToUpperInvariant();

        const string selectSql = "SELECT SettingKey, SettingValue, Description, SettingGroup FROM dbo.SystemSettings WHERE SettingKey = @Key;";
        var old = await connection.QueryFirstOrDefaultAsync(selectSql, new { Key = upperKey });
        if (old == null) return false;

        const string updateSql = @"
            UPDATE dbo.SystemSettings
            SET SettingValue = @Value,
                Description = ISNULL(@Description, Description),
                UpdatedAt = SYSUTCDATETIME(),
                UpdatedBy = @UpdatedBy
            WHERE SettingKey = @Key;";

        var rows = await connection.ExecuteAsync(updateSql, new
        {
            Key = upperKey,
            Value = value,
            Description = description?.Trim(),
            UpdatedBy = adminId
        });

        if (rows > 0)
        {
            await _auditLogService.LogAsync(
                actionType: "UPDATE_SYSTEM_SETTING",
                targetTable: "SystemSettings",
                targetId: 0,
                reason: $"Cập nhật tham số hệ thống: {upperKey} = '{value}'",
                oldData: old,
                newData: new { SettingKey = upperKey, SettingValue = value },
                customAdminId: adminId,
                ct: ct);

            return true;
        }

        return false;
    }

    public async Task<int> BatchUpdateSystemSettingsAsync(Dictionary<string, string> settings, long adminId, CancellationToken ct = default)
    {
        if (settings == null || settings.Count == 0) return 0;

        var connection = _dbContext.Database.GetDbConnection();
        if (connection.State != System.Data.ConnectionState.Open)
        {
            await connection.OpenAsync(ct);
        }

        using var tx = connection.BeginTransaction();
        try
        {
            int updatedCount = 0;
            var oldSnapshots = new Dictionary<string, string>();

            foreach (var kvp in settings)
            {
                var upperKey = kvp.Key.Trim().ToUpperInvariant();
                const string getValSql = "SELECT SettingValue FROM dbo.SystemSettings WHERE SettingKey = @Key;";
                var oldVal = await connection.ExecuteScalarAsync<string>(getValSql, new { Key = upperKey }, tx);
                if (oldVal != null)
                {
                    oldSnapshots[upperKey] = oldVal;
                    const string updateSql = @"
                        UPDATE dbo.SystemSettings
                        SET SettingValue = @Value,
                            UpdatedAt = SYSUTCDATETIME(),
                            UpdatedBy = @UpdatedBy
                        WHERE SettingKey = @Key;";

                    await connection.ExecuteAsync(updateSql, new
                    {
                        Key = upperKey,
                        Value = kvp.Value,
                        UpdatedBy = adminId
                    }, tx);

                    updatedCount++;
                }
            }

            tx.Commit();

            await _auditLogService.LogAsync(
                actionType: "BATCH_UPDATE_SYSTEM_SETTINGS",
                targetTable: "SystemSettings",
                targetId: 0,
                reason: $"Cập nhật đồng loạt {updatedCount} tham số hệ thống.",
                oldData: oldSnapshots,
                newData: settings,
                customAdminId: adminId,
                ct: ct);

            return updatedCount;
        }
        catch
        {
            tx.Rollback();
            throw;
        }
    }
}
