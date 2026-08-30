using Domain.Enums;

namespace Domain.Entities;

public class VisitLog
{
    public long Id { get; private set; }
    public long UserId { get; private set; }
    public long PlaceId { get; private set; }
    public DateOnly VisitedDate { get; private set; }
    public VisitPrivacy Privacy { get; private set; } = VisitPrivacy.Public;
    public DateTime CreatedAt { get; private set; }

    // Navigation
    public virtual User User { get; private set; } = null!;
    public virtual Place Place { get; private set; } = null!;
}
