using Domain.Enums;

namespace Domain.Entities;

public class TripMember
{
    public long TripId { get; private set; }
    public long UserId { get; private set; }
    public TripMemberRole Role { get; private set; } = TripMemberRole.Member;
    public DateTime JoinedAt { get; private set; }

    // Navigation
    public virtual Trip Trip { get; private set; } = null!;
    public virtual User User { get; private set; } = null!;

    protected TripMember() { }

    public TripMember(long tripId, long userId, TripMemberRole role = TripMemberRole.Member)
    {
        TripId = tripId;
        UserId = userId;
        Role = role;
        JoinedAt = DateTime.UtcNow;
    }

    public void ChangeRole(TripMemberRole newRole)
    {
        Role = newRole;
    }
}
