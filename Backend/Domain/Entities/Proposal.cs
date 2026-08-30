using Domain.Enums;

namespace Domain.Entities;

public class Proposal
{
    public long Id { get; private set; }
    public long UserId { get; private set; }
    public long? TargetPlaceId { get; private set; }
    public string ProposedDataJSON { get; private set; } = "{}";
    public ProposalStatus Status { get; private set; } = ProposalStatus.Pending;
    public string? RejectReason { get; private set; }
    public long? ReviewedBy { get; private set; }
    public DateTime? ReviewedAt { get; private set; }
    public DateTime CreatedAt { get; private set; }

    // Navigation
    public virtual User User { get; private set; } = null!;
    public virtual Place? TargetPlace { get; private set; }
    public virtual User? ReviewerAdmin { get; private set; }
}
