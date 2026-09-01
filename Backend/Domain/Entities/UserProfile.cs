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

    public UserProfile(long userId, string fullName, string? avatarUrl = "https://imageshare13.blob.core.windows.net/avatar/default-avatar.webp", string? googleId = null, string? phone = null)
    {
        UserId = userId;
        FullName = fullName.Trim();
        AvatarUrl = avatarUrl;
        CoverUrl = null;
        GoogleId = googleId;
        Phone = phone?.Trim();
        ReputationScore = 0;
        RankLevel = "Tân binh";
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetFullName(string fullName)
    {
        FullName = fullName.Trim();
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetPhone(string? phone)
    {
        Phone = phone?.Trim();
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetAvatarUrl(string? avatarUrl)
    {
        AvatarUrl = avatarUrl;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetCoverUrl(string? coverUrl)
    {
        CoverUrl = coverUrl;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetBio(string? bio)
    {
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
