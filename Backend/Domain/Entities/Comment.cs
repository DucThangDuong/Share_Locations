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

    protected Comment() { }

    public Comment(long reviewId, long userId, string content, long? parentId = null)
    {
        if (string.IsNullOrWhiteSpace(content))
            throw new ArgumentException("Nội dung bình luận không được để trống.", nameof(content));

        ReviewId = reviewId;
        UserId = userId;
        Content = content.Trim();
        ParentId = parentId;
        Status = CommentStatus.Active;
        CreatedAt = DateTime.UtcNow;
    }

    public void UpdateContent(string content)
    {
        if (string.IsNullOrWhiteSpace(content))
            throw new ArgumentException("Nội dung bình luận không được để trống.", nameof(content));

        Content = content.Trim();
    }

    public void Hide()
    {
        Status = CommentStatus.Hidden;
    }

    public void Restore()
    {
        Status = CommentStatus.Active;
    }
}
