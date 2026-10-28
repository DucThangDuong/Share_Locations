using Domain.Enums;

namespace Application.Common.Interfaces;

public interface IAuditLogService
{
    Task LogAsync(
        string actionType,
        string targetTable,
        long targetId,
        string? reason = null,
        object? oldData = null,
        object? newData = null,
        object? metadata = null,
        byte actionStatus = 1,
        long? customAdminId = null,
        CancellationToken ct = default);

    Task LogAsync(
        AdminActionType actionType,
        string targetTable,
        long targetId,
        string? reason = null,
        object? oldData = null,
        object? newData = null,
        object? metadata = null,
        byte actionStatus = 1,
        long? customAdminId = null,
        CancellationToken ct = default) =>
        LogAsync(actionType.ToString(), targetTable, targetId, reason, oldData, newData, metadata, actionStatus, customAdminId, ct);
}
