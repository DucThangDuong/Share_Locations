namespace Application.DTOs;

public class ReviewItemDto
{
    public long Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string? UserAvatar { get; set; }
    public byte Rating { get; set; }
    public string? Content { get; set; }
    public IReadOnlyList<string> Images { get; set; } = [];
    public int LikesCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class PlaceReviewSummaryDto
{
    public decimal AvgRating { get; set; }
    public int TotalReviews { get; set; }
    public Dictionary<string, int> RatingBreakdown { get; set; } = new()
    {
        ["5"] = 0,
        ["4"] = 0,
        ["3"] = 0,
        ["2"] = 0,
        ["1"] = 0
    };
    public IReadOnlyList<ReviewItemDto> Items { get; set; } = [];
}

public class ToggleSavePlaceDto
{
    public bool IsSaved { get; set; }
    public long PlaceId { get; set; }
}
