namespace Domain.Entities;

public class AdminRegionScope
{
    public long UserId { get; private set; }
    public int RegionId { get; private set; }
    public long? AssignedBy { get; private set; }
    public DateTime AssignedAt { get; private set; }

    // Navigation
    public virtual User User { get; private set; } = null!;
    public virtual Region Region { get; private set; } = null!;
    public virtual User? AssignedByUser { get; private set; }

    protected AdminRegionScope() { }

    public AdminRegionScope(long userId, int regionId, long? assignedBy = null)
    {
        UserId = userId;
        RegionId = regionId;
        AssignedBy = assignedBy;
        AssignedAt = DateTime.UtcNow;
    }
}
