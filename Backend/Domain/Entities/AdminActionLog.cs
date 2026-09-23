namespace Domain.Entities;

public class AdminActionLog
{
    public long Id { get; private set; }
    public long AdminId { get; private set; }
    public string? ActorRoleCode { get; private set; }
    public string ActionType { get; private set; } = string.Empty;
    public string TargetTable { get; private set; } = string.Empty;
    public long TargetId { get; private set; }
    public byte ActionStatus { get; private set; } = 1; // 1: Success, 2: Failed
    public string? Reason { get; private set; }
    public string? OldDataJSON { get; private set; }
    public string? NewDataJSON { get; private set; }
    public string? MetadataJSON { get; private set; }
    public string? RequestId { get; private set; }
    public string? CorrelationId { get; private set; }
    public string? IpAddress { get; private set; }
    public string? UserAgent { get; private set; }
    public DateTime CreatedAt { get; private set; }

    // Navigation
    public virtual User Admin { get; private set; } = null!;

    protected AdminActionLog() { }

    public AdminActionLog(
        long adminId,
        string actionType,
        string targetTable,
        long targetId,
        string? actorRoleCode = null,
        byte actionStatus = 1,
        string? reason = null,
        string? oldDataJson = null,
        string? newDataJson = null,
        string? metadataJson = null,
        string? requestId = null,
        string? correlationId = null,
        string? ipAddress = null,
        string? userAgent = null)
    {
        AdminId = adminId;
        ActionType = actionType;
        TargetTable = targetTable;
        TargetId = targetId;
        ActorRoleCode = actorRoleCode;
        ActionStatus = actionStatus;
        Reason = reason;
        OldDataJSON = oldDataJson;
        NewDataJSON = newDataJson;
        MetadataJSON = metadataJson;
        RequestId = requestId;
        CorrelationId = correlationId;
        IpAddress = ipAddress;
        UserAgent = userAgent;
        CreatedAt = DateTime.UtcNow;
    }
}
