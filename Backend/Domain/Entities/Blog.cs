using Domain.Enums;

namespace Domain.Entities;

public class Blog
{
    public long Id { get; private set; }
    public long AuthorId { get; private set; }
    public int? CategoryId { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string? Excerpt { get; private set; }
    public string ContentJSON { get; private set; } = "{}";
    public string? CoverImageUrl { get; private set; }
    public int ReadTimeMinutes { get; private set; } = 5;
    public int ViewCount { get; private set; }
    public BlogStatus Status { get; private set; } = BlogStatus.Published;
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    // Navigation
    public virtual User Author { get; private set; } = null!;
    public virtual Category? Category { get; private set; }

    private readonly List<BlogReport> _reports = new();
    public virtual IReadOnlyCollection<BlogReport> Reports => _reports.AsReadOnly();
}
