namespace Domain.Entities;

public class ReputationLog
{
    public long Id { get; private set; }
    public long UserId { get; private set; }
    public string ActionType { get; private set; } = string.Empty;
    public int Points { get; private set; }
    public int BalanceAfter { get; private set; }
    public long? EntityId { get; private set; }
    public string? Description { get; private set; }
    public DateTime CreatedAt { get; private set; }

    public virtual User User { get; private set; } = null!;

    protected ReputationLog() { }

    public ReputationLog(
        long userId,
        string actionType,
        int points,
        int balanceAfter,
        long? entityId = null,
        string? description = null)
    {
        UserId = userId;
        ActionType = actionType;
        Points = points;
        BalanceAfter = balanceAfter;
        EntityId = entityId;
        Description = description?.Trim();
        CreatedAt = DateTime.UtcNow;
    }
}
