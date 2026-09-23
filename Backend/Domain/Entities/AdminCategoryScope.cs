namespace Domain.Entities;

public class AdminCategoryScope
{
    public long UserId { get; private set; }
    public int CategoryId { get; private set; }
    public long? AssignedBy { get; private set; }
    public DateTime AssignedAt { get; private set; }

    // Navigation
    public virtual User User { get; private set; } = null!;
    public virtual Category Category { get; private set; } = null!;
    public virtual User? AssignedByUser { get; private set; }

    protected AdminCategoryScope() { }

    public AdminCategoryScope(long userId, int categoryId, long? assignedBy = null)
    {
        UserId = userId;
        CategoryId = categoryId;
        AssignedBy = assignedBy;
        AssignedAt = DateTime.UtcNow;
    }
}
