using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Json.Serialization;
using Application.Common.Interfaces;
using Dapper;
using Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

public class AuditLogService : IAuditLogService
{
    private readonly TravelReviewDbContext _dbContext;
    private readonly ICurrentUserService _currentUserService;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<AuditLogService> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
        WriteIndented = false
    };

    public AuditLogService(
        TravelReviewDbContext dbContext,
        ICurrentUserService currentUserService,
        IHttpContextAccessor httpContextAccessor,
        ILogger<AuditLogService> logger)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
    }

    public async Task LogAsync(
        string actionType,
        string targetTable,
        long targetId,
        string? reason = null,
        object? oldData = null,
        object? newData = null,
        object? metadata = null,
        byte actionStatus = 1,
        long? customAdminId = null,
        CancellationToken ct = default)
    {
        try
        {
            var adminId = customAdminId ?? _currentUserService.UserId;
            if (!adminId.HasValue || adminId.Value <= 0)
            {
                // Nếu không có thông tin AdminId (ví dụ request unauthenticated hoặc hệ thống), bỏ qua để tránh vi phạm NOT NULL
                return;
            }

            var role = _currentUserService.IsSystemAdmin
                ? "SystemAdmin"
                : (_currentUserService.IsCategoryAdmin ? "CategoryAdmin" : _currentUserService.Roles.FirstOrDefault());

            var ip = GetClientIpAddress();
            var userAgent = GetUserAgent();
            var requestId = _httpContextAccessor.HttpContext?.TraceIdentifier;

            var oldJson = SerializeJson(oldData);
            var newJson = SerializeJson(newData);
            var metaJson = SerializeJson(metadata);

            var connection = _dbContext.Database.GetDbConnection();

            const string sql = @"
                INSERT INTO dbo.AdminActionLogs (
                    AdminId, ActorRoleCode, ActionType, TargetTable, TargetId,
                    ActionStatus, Reason, OldDataJSON, NewDataJSON, MetadataJSON,
                    RequestId, CorrelationId, IpAddress, UserAgent, CreatedAt
                ) VALUES (
                    @AdminId, @ActorRoleCode, @ActionType, @TargetTable, @TargetId,
                    @ActionStatus, @Reason, @OldDataJson, @NewDataJson, @MetadataJson,
                    @RequestId, @CorrelationId, @IpAddress, @UserAgent, SYSUTCDATETIME()
                );";

            await connection.ExecuteAsync(new CommandDefinition(sql, new
            {
                AdminId = adminId.Value,
                ActorRoleCode = role,
                ActionType = actionType.Length > 50 ? actionType[..50] : actionType,
                TargetTable = targetTable.Length > 50 ? targetTable[..50] : targetTable,
                TargetId = targetId,
                ActionStatus = actionStatus,
                Reason = reason != null && reason.Length > 500 ? reason[..500] : reason,
                OldDataJson = oldJson,
                NewDataJson = newJson,
                MetadataJson = metaJson,
                RequestId = requestId != null && requestId.Length > 100 ? requestId[..100] : requestId,
                CorrelationId = (string?)null,
                IpAddress = ip,
                UserAgent = userAgent
            }, cancellationToken: ct));
        }
        catch (Exception ex)
        {
            // Ponytail principle: Audit log failure must NEVER crash the business transaction
            _logger.LogWarning(ex, "Failed to record audit log for Action: {ActionType}, Target: {TargetTable} #{TargetId}",
                actionType, targetTable, targetId);
        }
    }

    private string? GetClientIpAddress()
    {
        var ctx = _httpContextAccessor.HttpContext;
        if (ctx == null) return null;

        if (ctx.Request.Headers.TryGetValue("X-Forwarded-For", out var forwarded))
        {
            var ip = forwarded.ToString().Split(',').FirstOrDefault()?.Trim();
            if (!string.IsNullOrWhiteSpace(ip)) return ip.Length > 45 ? ip[..45] : ip;
        }

        var remoteIp = ctx.Connection.RemoteIpAddress?.ToString();
        return remoteIp != null && remoteIp.Length > 45 ? remoteIp[..45] : remoteIp;
    }

    private string? GetUserAgent()
    {
        var ua = _httpContextAccessor.HttpContext?.Request.Headers.UserAgent.ToString();
        return string.IsNullOrWhiteSpace(ua) ? null : (ua.Length > 500 ? ua[..500] : ua);
    }

    private static string? SerializeJson(object? obj)
    {
        if (obj == null) return null;
        if (obj is string s) return s;
        try
        {
            return JsonSerializer.Serialize(obj, JsonOptions);
        }
        catch
        {
            return null;
        }
    }
}
