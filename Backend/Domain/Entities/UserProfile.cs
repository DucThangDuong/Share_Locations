namespace Domain.Entities;

public class UserProfile
{
    public long UserId { get; private set; }
    public string FullName { get; private set; } = string.Empty;
    public string? Phone { get; private set; }
    public string? AvatarUrl { get; private set; }
    public string? CoverUrl { get; private set; }
    public string? Bio { get; private set; }
    public string? GoogleId { get; private set; }
    public int ReputationScore { get; private set; }
    public string RankLevel { get; private set; } = "Tân binh";
    public DateTime UpdatedAt { get; private set; }

    // Navigation
    public virtual User User { get; private set; } = null!;
}
