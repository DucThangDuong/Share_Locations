using Domain.Enums;

namespace Domain.Entities;

public class CommentReport
{
    public long Id { get; private set; }
    public long ReporterId { get; private set; }
    public long CommentId { get; private set; }
    public int ReportTypeId { get; private set; }
    public string? Reason { get; private set; }
    public ReportStatus Status { get; private set; } = ReportStatus.Pending;
    public string? AdminNote { get; private set; }
    public long? ResolvedBy { get; private set; }
    public DateTime? ResolvedAt { get; private set; }
    public DateTime CreatedAt { get; private set; }

    // Navigation
    public virtual User Reporter { get; private set; } = null!;
    public virtual Comment Comment { get; private set; } = null!;
    public virtual ReportType ReportType { get; private set; } = null!;
    public virtual User? Resolver { get; private set; }

    protected CommentReport() { }

    public CommentReport(long reporterId, long commentId, int reportTypeId, string? reason)
    {
        ReporterId = reporterId;
        CommentId = commentId;
        ReportTypeId = reportTypeId;
        Reason = reason;
        Status = ReportStatus.Pending;
        CreatedAt = DateTime.UtcNow;
    }

    public void Resolve(long adminId, ReportStatus status, string? adminNote = null)
    {
        ResolvedBy = adminId;
        Status = status;
        AdminNote = adminNote;
        ResolvedAt = DateTime.UtcNow;
    }
}
