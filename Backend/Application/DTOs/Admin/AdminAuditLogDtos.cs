using Domain.Constants;

namespace Application.DTOs.Admin;

public class AdminAuditLogListItemDto
{
    public long Id { get; set; }
    public long AdminId { get; set; }
    public string AdminName { get; set; } = string.Empty;
    public string? AdminEmail { get; set; }
    public string? AdminAvatar { get; set; }
    public string? ActorRoleCode { get; set; }
    public string ActorRoleName => AdminDisplayNames.GetRoleName(ActorRoleCode);
    public string ActionType { get; set; } = string.Empty;
    public string ActionTypeName => AdminDisplayNames.GetActionTypeName(ActionType);
    public string TargetTable { get; set; } = string.Empty;
    public string TargetTableName => AdminDisplayNames.GetTargetTableName(TargetTable);
    public long TargetId { get; set; }
    public string? TargetName { get; set; }
    public byte ActionStatus { get; set; } = 1; // 1: Success, 2: Failed
    public string ActionStatusText => ActionStatus == 1 ? "Thành công" : "Thất bại";
    public string? Reason { get; set; }
    public string? IpAddress { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AdminAuditLogDetailDto : AdminAuditLogListItemDto
{
    public string? OldDataJSON { get; set; }
    public string? NewDataJSON { get; set; }
    public string? MetadataJSON { get; set; }
    public string? RequestId { get; set; }
    public string? UserAgent { get; set; }
}

public class GetAdminAuditLogsRequestDto
{
    public long? AdminId { get; set; }
    public string? ActionType { get; set; }
    public string? TargetTable { get; set; }
    public long? TargetId { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public string? Keyword { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}
