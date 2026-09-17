using System.Text.Json.Serialization;

namespace Application.DTOs;

public class ReviewItemDto
{
    [JsonPropertyName("id")]
    public long Id { get; set; }

    [JsonPropertyName("userId")]
    public string UserId { get; set; } = string.Empty;

    [JsonPropertyName("userName")]
    public string UserName { get; set; } = string.Empty;

    [JsonPropertyName("userAvatar")]
    public string? UserAvatar { get; set; }

    [JsonPropertyName("rating")]
    public byte Rating { get; set; }

    [JsonPropertyName("content")]
    public string? Content { get; set; }

    [JsonPropertyName("images")]
    public IReadOnlyList<string> Images { get; set; } = [];

    [JsonPropertyName("videos")]
    public IReadOnlyList<string> Videos { get; set; } = [];

    [JsonPropertyName("likesCount")]
    public int LikesCount { get; set; }

    [JsonPropertyName("isLiked")]
    public bool IsLiked { get; set; }

    [JsonPropertyName("commentsCount")]
    public int CommentsCount { get; set; }

    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; }
}

public class ReviewLikeResponseDto
{
    [JsonPropertyName("isLiked")]
    public bool IsLiked { get; set; }

    [JsonPropertyName("likesCount")]
    public int LikesCount { get; set; }
}

public class CommentDto
{
    [JsonPropertyName("id")]
    public long Id { get; set; }

    [JsonPropertyName("reviewId")]
    public long ReviewId { get; set; }

    [JsonPropertyName("userId")]
    public string UserId { get; set; } = string.Empty;

    [JsonPropertyName("userName")]
    public string UserName { get; set; } = string.Empty;

    [JsonPropertyName("userAvatar")]
    public string? UserAvatar { get; set; }

    [JsonPropertyName("content")]
    public string Content { get; set; } = string.Empty;

    [JsonPropertyName("parentId")]
    public long? ParentId { get; set; }

    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; }

    [JsonPropertyName("replies")]
    public List<CommentDto> Replies { get; set; } = [];
}

public class ReviewCommentsDto
{
    [JsonPropertyName("totalComments")]
    public int TotalComments { get; set; }

    [JsonPropertyName("items")]
    public IReadOnlyList<CommentDto> Items { get; set; } = [];
}

public class PlaceReviewSummaryDto
{
    [JsonPropertyName("avgRating")]
    public decimal AvgRating { get; set; }

    [JsonPropertyName("totalReviews")]
    public int TotalReviews { get; set; }

    [JsonPropertyName("ratingBreakdown")]
    public Dictionary<string, int> RatingBreakdown { get; set; } = new()
    {
        ["5"] = 0,
        ["4"] = 0,
        ["3"] = 0,
        ["2"] = 0,
        ["1"] = 0
    };

    [JsonPropertyName("items")]
    public IReadOnlyList<ReviewItemDto> Items { get; set; } = [];
}

public class ToggleSavePlaceDto
{
    [JsonPropertyName("isSaved")]
    public bool IsSaved { get; set; }

    [JsonPropertyName("placeId")]
    public long PlaceId { get; set; }
}
