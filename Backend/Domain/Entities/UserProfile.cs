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

    protected UserProfile() { }

    public UserProfile(long userId, string fullName, string? avatarUrl = null, string? phone = null, string? googleId = null)
    {
        UserId = userId;
        FullName = fullName.Trim();
        AvatarUrl = avatarUrl;
        Phone = phone?.Trim();
        GoogleId = googleId;
        ReputationScore = 0;
        RankLevel = "Tân binh";
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateProfile(string fullName, string? phone, string? avatarUrl, string? coverUrl, string? bio)
    {
        FullName = fullName.Trim();
        Phone = phone?.Trim();
        AvatarUrl = avatarUrl;
        CoverUrl = coverUrl;
        Bio = bio?.Trim();
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetGoogleId(string googleId)
    {
        GoogleId = googleId;
        UpdatedAt = DateTime.UtcNow;
    }

    public void AddReputationScore(int points)
    {
        ReputationScore += points;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetRankLevel(string rankLevel)
    {
        RankLevel = rankLevel;
        UpdatedAt = DateTime.UtcNow;
    }
}
