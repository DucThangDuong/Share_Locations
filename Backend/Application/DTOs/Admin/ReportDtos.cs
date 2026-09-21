namespace Application.DTOs.Admin;

public class ReportReasonDto
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<string> ApplicableTargets { get; set; } = new();
}

public class ReportQueueItemDto
{
    public long Id { get; set; }
    public string CodeId { get; set; } = string.Empty;
    public string TargetType { get; set; } = string.Empty; // place, review, comment, blog
    public long TargetId { get; set; }
    public string TargetTitle { get; set; } = string.Empty;
    public string? TargetSubtitle { get; set; }
    public string? TargetContent { get; set; }
    public string? TargetImage { get; set; }
    public long? ReporterId { get; set; }
    public string ReporterName { get; set; } = string.Empty;
    public string? ReporterAvatar { get; set; }
    public string ReportTypeCode { get; set; } = string.Empty;
    public string ReportTypeName { get; set; } = string.Empty;
    public string ReasonContent { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime SubmittedAt { get; set; }
    public string Priority { get; set; } = "normal"; // urgent, high, normal, low
    public int Status { get; set; } // 0: Pending, 1: Resolved, 2: Dismissed
    public string StatusText => Status switch
    {
        0 => "Chờ xử lý",
        1 => "Đã giải quyết",
        2 => "Đã bác bỏ",
        _ => "Không xác định"
    };
    public long? AssignedToAdminId { get; set; }
    public string? AssignedToAdminName { get; set; }
    public string? Province { get; set; }
    public string? Category { get; set; }
}

public class GroupedReportDto
{
    public string GroupKey { get; set; } = string.Empty; // e.g. "review_503"
    public string TargetType { get; set; } = string.Empty;
    public long TargetId { get; set; }
    public string TargetTitle { get; set; } = string.Empty;
    public string? TargetSubtitle { get; set; }
    public string? TargetContent { get; set; }
    public decimal? TargetRating { get; set; }
    public string? Province { get; set; }
    public string? Category { get; set; }
    public int ReportsCount { get; set; }
    public string HighestPriority { get; set; } = "normal";
    public bool HasUnresolvedUrgent { get; set; }
    public DateTime? LatestReportAt { get; set; }
    public int Status { get; set; }
    public List<ReportQueueItemDto> ReportsList { get; set; } = new();
}

public class CreateReportInput
{
    public string TargetType { get; set; } = string.Empty; // place, review, comment, blog
    public long TargetId { get; set; }
    public int ReasonId { get; set; }
    public string? Description { get; set; }
    public string? ContactEmail { get; set; }
}

public class ResolveReportInput
{
    public string Decision { get; set; } = "accept"; // "accept" | "dismiss"
    public string? ActionTaken { get; set; } // "hide_target" | "delete_permanently"
    public string? ResolutionNote { get; set; }
    public string? DismissReason { get; set; }
    public bool AutoCloseDuplicates { get; set; } = true;
    public bool AutoRecalculateRating { get; set; } = true;
}
