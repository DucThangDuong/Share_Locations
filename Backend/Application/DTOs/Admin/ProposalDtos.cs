namespace Application.DTOs.Admin;

public class AdminProposalSummaryDto
{
    public long Id { get; set; }
    public string PlaceName { get; set; } = string.Empty;
    public string? CoverImg { get; set; }
    public string Address { get; set; } = string.Empty;
    public string? CategoryName { get; set; }
    public string? ProvinceName { get; set; }
    public string ProposerName { get; set; } = string.Empty;
    public string? ProposerAvatar { get; set; }
    public int Status { get; set; } // 0: Pending, 1: Approved, 2: Rejected
    public DateTime SubmittedAt { get; set; }
    public string? AdminNote { get; set; }
    public string? RejectReason { get; set; }

    // Aliases hỗ trợ tương thích Frontend
    public string? Category { get => CategoryName; set => CategoryName = value; }
    public string? Province { get => ProvinceName; set => ProvinceName = value; }
    public string ProposedBy { get => ProposerName; set => ProposerName = value; }
    public string? UserAvatar { get => ProposerAvatar; set => ProposerAvatar = value; }
    public string StatusText => Status switch
    {
        0 => "Chờ duyệt",
        1 => "Đã duyệt",
        2 => "Đã từ chối",
        _ => "Không xác định"
    };
}

public class ProposalProposerDto
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? AvatarUrl { get; set; }
}

public class ProposalPlaceDataDto
{
    public string Name { get; set; } = string.Empty;
    public int? CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public int? ProvinceId { get; set; }
    public string? ProvinceName { get; set; }
    public string Address { get; set; } = string.Empty;
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public string? Phone { get; set; }
    public string? Website { get; set; }
    public string? OpeningHours { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public bool IsFree { get; set; }
    public string? Description { get; set; }
    public string? CoverImg { get; set; }
    public List<string> Images { get; set; } = new();
}

public class AdminProposalDetailDto
{
    public long Id { get; set; }
    public string Type { get; set; } = "new_place";
    public int Status { get; set; }
    public DateTime SubmittedAt { get; set; }
    public string? AdminNote { get; set; }
    public string? RejectReason { get; set; }

    public ProposalProposerDto Proposer { get; set; } = new();
    public ProposalPlaceDataDto PlaceData { get; set; } = new();
}

public class AdminProposalDto : AdminProposalSummaryDto
{
    public string Type { get; set; } = "new_place";
    public long UserId { get; set; }
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
