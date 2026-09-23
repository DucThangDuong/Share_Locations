namespace Domain.Entities;

public class AdminProvinceScope
{
    public long UserId { get; private set; }
    public int ProvinceId { get; private set; }
    public long? AssignedBy { get; private set; }
    public DateTime AssignedAt { get; private set; }

    // Navigation
    public virtual User User { get; private set; } = null!;
    public virtual Province Province { get; private set; } = null!;
    public virtual User? AssignedByUser { get; private set; }

    protected AdminProvinceScope() { }

    public AdminProvinceScope(long userId, int provinceId, long? assignedBy = null)
    {
        UserId = userId;
        ProvinceId = provinceId;
        AssignedBy = assignedBy;
        AssignedAt = DateTime.UtcNow;
    }
}
