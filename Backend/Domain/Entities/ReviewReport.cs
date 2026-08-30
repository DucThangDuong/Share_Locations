using Domain.Enums;

namespace Domain.Entities;

public class ReviewReport
{
    public long Id { get; private set; }
    public long ReporterId { get; private set; }
    public long ReviewId { get; private set; }
    public string Reason { get; private set; } = string.Empty;
    public ReportStatus Status { get; private set; } = ReportStatus.Pending;
    public long? ResolvedBy { get; private set; }
    public DateTime? ResolvedAt { get; private set; }
    public DateTime CreatedAt { get; private set; }

    // Navigation
    public virtual User Reporter { get; private set; } = null!;
    public virtual Review Review { get; private set; } = null!;
    public virtual User? Resolver { get; private set; }
}
