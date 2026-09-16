namespace Application.DTOs;

public class FriendItemDto
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Avatar { get; set; }
    public string? CoverUrl { get; set; }
    public string? Email { get; set; }
    public string? Bio { get; set; }
    public string? RankLevel { get; set; }
    public int ReputationScore { get; set; }
    public int MutualFriendsCount { get; set; }
    public int TripsCount { get; set; }
    public string Status { get; set; } = "accepted";
    public DateTime? RequestedAt { get; set; }
}

public class FriendsResponseDto
{
    public List<FriendItemDto> Friends { get; set; } = new();
    public List<FriendItemDto> PendingRequestsReceived { get; set; } = new();
    public List<FriendItemDto> PendingRequestsSent { get; set; } = new();
}

public class RespondFriendRequestDto
{
    public string Action { get; set; } = "accept";
}
