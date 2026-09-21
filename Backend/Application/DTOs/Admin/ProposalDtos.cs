namespace Application.DTOs.Admin;

public class AdminProposalDto
{
    public long Id { get; set; }
    public string Type { get; set; } = "new_place"; // "new_place" | "update_info"
    public string PlaceName { get; set; } = string.Empty;
    public long UserId { get; set; }
    public string ProposedBy { get; set; } = string.Empty;
    public string? UserAvatar { get; set; }
    public string? Category { get; set; }
    public string? Province { get; set; }
    public DateTime SubmittedAt { get; set; }
    public int Status { get; set; } // 0: Pending, 1: Approved, 2: Rejected
    public string StatusText => Status switch
    {
        0 => "Chờ duyệt",
        1 => "Đã duyệt",
        2 => "Đã từ chối",
        _ => "Không xác định"
    };
    public string? Note { get; set; }
    public long? TargetPlaceId { get; set; }
    public string? TargetPlaceName { get; set; }
    public string ProposedDataJson { get; set; } = "{}";
    public string? RejectionReason { get; set; }
}

public class ApproveProposalInput
{
    public long? TargetPlaceId { get; set; }
    public int? RewardPoints { get; set; }
}

public class RejectProposalInput
{
    public string RejectionReason { get; set; } = string.Empty;
}
