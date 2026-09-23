namespace Domain.Entities;

public class UserRole
{
    public long UserId { get; private set; }
    public byte RoleId { get; private set; }
    public long? AssignedBy { get; private set; }
    public DateTime AssignedAt { get; private set; }
    public DateTime? ExpiresAt { get; private set; }

    // Navigation
    public virtual User User { get; private set; } = null!;
    public virtual Role Role { get; private set; } = null!;
    public virtual User? AssignedByUser { get; private set; }

    protected UserRole() { }

    public UserRole(long userId, byte roleId, long? assignedBy = null, DateTime? expiresAt = null)
    {
        UserId = userId;
        RoleId = roleId;
        AssignedBy = assignedBy;
        AssignedAt = DateTime.UtcNow;
        ExpiresAt = expiresAt;
    }
}
