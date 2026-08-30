using Domain.Enums;

namespace Domain.Entities;

public class Review
{
    public long Id { get; private set; }
    public long PlaceId { get; private set; }
    public long UserId { get; private set; }
    public byte Rating { get; private set; }
    public string? Content { get; private set; }
    public DateOnly? VisitDate { get; private set; }
    public ReviewStatus Status { get; private set; } = ReviewStatus.Active;
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    // Navigation
    public virtual Place Place { get; private set; } = null!;
    public virtual User User { get; private set; } = null!;

    private readonly List<ReviewMedia> _media = new();
    public virtual IReadOnlyCollection<ReviewMedia> Media => _media.AsReadOnly();

    private readonly List<Comment> _comments = new();
    public virtual IReadOnlyCollection<Comment> Comments => _comments.AsReadOnly();

    private readonly List<ReviewReport> _reports = new();
    public virtual IReadOnlyCollection<ReviewReport> Reports => _reports.AsReadOnly();
}
