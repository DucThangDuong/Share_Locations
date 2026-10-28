using System.Text.Json.Serialization;

namespace Application.DTOs;

public class ReputationAwardResult
{
    public bool Awarded { get; set; }
    public int PointsAwarded { get; set; }
    public int NewBalance { get; set; }
    public string NewRankLevel { get; set; } = string.Empty;
    public bool RankLeveledUp { get; set; }
    public string Message { get; set; } = string.Empty;

    public static ReputationAwardResult Skipped(string reason, int currentBalance = 0, string currentRank = "") => new()
    {
        Awarded = false,
        PointsAwarded = 0,
        NewBalance = currentBalance,
        NewRankLevel = currentRank,
        RankLeveledUp = false,
        Message = reason
    };

    public static ReputationAwardResult Success(int points, int newBalance, string newRank, bool leveledUp, string message) => new()
    {
        Awarded = true,
        PointsAwarded = points,
        NewBalance = newBalance,
        NewRankLevel = newRank,
        RankLeveledUp = leveledUp,
        Message = message
    };
}

public class ReputationLogDto
{
    [JsonPropertyName("id")]
    public long Id { get; set; }

    [JsonPropertyName("actionType")]
    public string ActionType { get; set; } = string.Empty;

    [JsonPropertyName("actionName")]
    public string ActionName { get; set; } = string.Empty;

    [JsonPropertyName("points")]
    public int Points { get; set; }

    [JsonPropertyName("balanceAfter")]
    public int BalanceAfter { get; set; }

    [JsonPropertyName("entityId")]
    public long? EntityId { get; set; }

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; }
}
