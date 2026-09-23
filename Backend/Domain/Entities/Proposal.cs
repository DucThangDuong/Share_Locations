using Domain.Enums;

namespace Domain.Entities;

public class Proposal
{
    public long Id { get; private set; }
    public long UserId { get; private set; }
    public long? TargetPlaceId { get; private set; }
    public int? CategoryId { get; private set; }
    public int? ProvinceId { get; private set; }
    public ProposalType ProposalType { get; private set; } = ProposalType.NewPlace;
    public string ProposedDataJSON { get; private set; } = "{}";
    public ProposalStatus Status { get; private set; } = ProposalStatus.Pending;
    public string? AdminNote { get; private set; }
    public string? RejectReason { get; private set; }
    public long? ReviewedBy { get; private set; }
    public DateTime? ReviewedAt { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    // Navigation
    public virtual User User { get; private set; } = null!;
    public virtual Place? TargetPlace { get; private set; }
    public virtual Category? Category { get; private set; }
    public virtual Province? Province { get; private set; }
    public virtual User? ReviewerAdmin { get; private set; }

    protected Proposal() { }

    public Proposal(
        long userId,
        string proposedDataJson,
        long? targetPlaceId = null,
        int? categoryId = null,
        int? provinceId = null,
        ProposalType proposalType = ProposalType.NewPlace)
    {
        UserId = userId;
        ProposedDataJSON = string.IsNullOrWhiteSpace(proposedDataJson) ? "{}" : proposedDataJson;
        TargetPlaceId = targetPlaceId;
        CategoryId = categoryId;
        ProvinceId = provinceId;
        ProposalType = proposalType;
        Status = ProposalStatus.Pending;
        CreatedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Approve(long reviewerId, string? adminNote = null)
    {
        Status = ProposalStatus.Approved;
        ReviewedBy = reviewerId;
        ReviewedAt = DateTime.UtcNow;
        AdminNote = adminNote;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Reject(long reviewerId, string reason, string? adminNote = null)
    {
        Status = ProposalStatus.Rejected;
        RejectReason = reason;
        ReviewedBy = reviewerId;
        ReviewedAt = DateTime.UtcNow;
        AdminNote = adminNote;
        UpdatedAt = DateTime.UtcNow;
    }

    public void RequestAddition(long reviewerId, string adminNote)
    {
        Status = ProposalStatus.RequiresAddition;
        ReviewedBy = reviewerId;
        ReviewedAt = DateTime.UtcNow;
        AdminNote = adminNote;
        UpdatedAt = DateTime.UtcNow;
    }
}
