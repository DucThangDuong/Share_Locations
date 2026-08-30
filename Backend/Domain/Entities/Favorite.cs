using Domain.Enums;

namespace Domain.Entities;

public class Favorite
{
    public long UserId { get; private set; }
    public long TargetId { get; private set; }
    public FavoriteTargetType TargetType { get; private set; }
    public DateTime CreatedAt { get; private set; }

    // Navigation
    public virtual User User { get; private set; } = null!;
}
