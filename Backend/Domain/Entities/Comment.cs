using Domain.Enums;

namespace Domain.Entities;

public class Comment
{
    public long Id { get; private set; }
    public long ReviewId { get; private set; }
    public long UserId { get; private set; }
    public long? ParentId { get; private set; }
    public string Content { get; private set; } = string.Empty;
    public CommentStatus Status { get; private set; } = CommentStatus.Active;
    public DateTime CreatedAt { get; private set; }

    // Navigation
    public virtual Review Review { get; private set; } = null!;
    public virtual User User { get; private set; } = null!;
    public virtual Comment? ParentComment { get; private set; }

    private readonly List<Comment> _replies = new();
    public virtual IReadOnlyCollection<Comment> Replies => _replies.AsReadOnly();

    private readonly List<CommentReport> _reports = new();
    public virtual IReadOnlyCollection<CommentReport> Reports => _reports.AsReadOnly();
}
