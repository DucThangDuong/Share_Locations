namespace Application.DTOs.Admin;

public class AdminReviewItemDto
{
    public long Id { get; set; }
    public long PlaceId { get; set; }
    public string PlaceName { get; set; } = string.Empty;
    public string? Category { get; set; }
    public string? Province { get; set; }
    public long UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? UserAvatar { get; set; }
    public byte Rating { get; set; }
    public string? Content { get; set; }
    public List<string> Images { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public string Status { get; set; } = "active"; // "active" | "hidden"
    public int ReportCount { get; set; }
}

public class AdminCommentItemDto
{
    public long Id { get; set; }
    public long? BlogId { get; set; }
    public string? BlogTitle { get; set; }
    public long? ReviewId { get; set; }
    public long UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? UserAvatar { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string Status { get; set; } = "active"; // "active" | "hidden"
    public int ReportCount { get; set; }
}

public class UpdateEntityStatusInput
{
    public string Status { get; set; } = "active"; // "active" | "hidden"
}
