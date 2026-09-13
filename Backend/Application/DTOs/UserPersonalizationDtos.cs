using System.Text.Json.Serialization;

namespace Application.DTOs;

public class UserFavoriteItemDto
{
    [JsonPropertyName("id")]
    public long Id { get; set; }

    [JsonPropertyName("targetId")]
    public long TargetId { get; set; }

    [JsonPropertyName("targetType")]
    public int TargetType { get; set; }

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("subtitle")]
    public string? Subtitle { get; set; }

    [JsonPropertyName("coverImg")]
    public string? CoverImg { get; set; }

    [JsonPropertyName("categoryTag")]
    public string CategoryTag { get; set; } = string.Empty;

    [JsonPropertyName("rating")]
    public double Rating { get; set; }

    [JsonPropertyName("reviewCount")]
    public int ReviewCount { get; set; }

    [JsonPropertyName("price")]
    public string? Price { get; set; }

    [JsonPropertyName("savedDate")]
    public string SavedDate { get; set; } = string.Empty;
}

public class UserFavoritePagedResultDto
{
    [JsonPropertyName("items")]
    public IReadOnlyList<UserFavoriteItemDto> Items { get; set; } = new List<UserFavoriteItemDto>();

    [JsonPropertyName("page")]
    public int Page { get; set; }

    [JsonPropertyName("pageSize")]
    public int PageSize { get; set; }

    [JsonPropertyName("totalCount")]
    public long TotalCount { get; set; }

    [JsonPropertyName("totalPages")]
    public int TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)TotalCount / PageSize) : 0;
}

public class AddFavoriteRequestDto
{
    [JsonPropertyName("targetType")]
    public int TargetType { get; set; }

    [JsonPropertyName("targetId")]
    public long TargetId { get; set; }
}

public class AddFavoriteResponseDto
{
    [JsonPropertyName("isSaved")]
    public bool IsSaved { get; set; } = true;

    [JsonPropertyName("targetType")]
    public int TargetType { get; set; }

    [JsonPropertyName("targetId")]
    public long TargetId { get; set; }
}

public class UserVisitLogItemDto
{
    [JsonPropertyName("id")]
    public long Id { get; set; }

    [JsonPropertyName("placeId")]
    public long PlaceId { get; set; }

    [JsonPropertyName("placeName")]
    public string PlaceName { get; set; } = string.Empty;

    [JsonPropertyName("province")]
    public string? Province { get; set; }

    [JsonPropertyName("category")]
    public string? Category { get; set; }

    [JsonPropertyName("visitedDate")]
    public string VisitedDate { get; set; } = string.Empty;

    [JsonPropertyName("privacy")]
    public int Privacy { get; set; }

    [JsonPropertyName("coverImg")]
    public string? CoverImg { get; set; }

    [JsonPropertyName("lat")]
    public double? Lat { get; set; }

    [JsonPropertyName("lng")]
    public double? Lng { get; set; }

    [JsonPropertyName("createdAt")]
    public string CreatedAt { get; set; } = string.Empty;
}

public class UserVisitLogPagedResultDto
{
    [JsonPropertyName("items")]
    public IReadOnlyList<UserVisitLogItemDto> Items { get; set; } = new List<UserVisitLogItemDto>();

    [JsonPropertyName("totalCount")]
    public long TotalCount { get; set; }

    [JsonPropertyName("page")]
    public int Page { get; set; }

    [JsonPropertyName("pageSize")]
    public int PageSize { get; set; }

    [JsonPropertyName("totalPages")]
    public int TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)TotalCount / PageSize) : 0;
}

public class CreateVisitLogRequestDto
{
    [JsonPropertyName("placeId")]
    public long PlaceId { get; set; }

    [JsonPropertyName("visitedDate")]
    public string VisitedDate { get; set; } = string.Empty;

    [JsonPropertyName("privacy")]
    public int Privacy { get; set; } = 0;
}

public class UpdateVisitLogRequestDto
{
    [JsonPropertyName("visitedDate")]
    public string VisitedDate { get; set; } = string.Empty;

    [JsonPropertyName("privacy")]
    public int Privacy { get; set; }
}

public class ChangeVisitPrivacyRequestDto
{
    [JsonPropertyName("privacy")]
    public int Privacy { get; set; }
}

public class UserProposalItemDto
{
    [JsonPropertyName("id")]
    public long Id { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("category")]
    public string? Category { get; set; }

    [JsonPropertyName("province")]
    public string? Province { get; set; }

    [JsonPropertyName("address")]
    public string? Address { get; set; }

    [JsonPropertyName("openingHours")]
    public string? OpeningHours { get; set; }

    [JsonPropertyName("minPrice")]
    public decimal? MinPrice { get; set; }

    [JsonPropertyName("maxPrice")]
    public decimal? MaxPrice { get; set; }

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("coverImg")]
    public string? CoverImg { get; set; }

    [JsonPropertyName("mediaUrls")]
    public List<string> MediaUrls { get; set; } = new();

    [JsonPropertyName("status")]
    public int Status { get; set; }

    [JsonPropertyName("rejectReason")]
    public string? RejectReason { get; set; }

    [JsonPropertyName("createdAt")]
    public string CreatedAt { get; set; } = string.Empty;
}

public class UserProposalPagedResultDto
{
    [JsonPropertyName("items")]
    public IReadOnlyList<UserProposalItemDto> Items { get; set; } = new List<UserProposalItemDto>();

    [JsonPropertyName("totalCount")]
    public long TotalCount { get; set; }

    [JsonPropertyName("page")]
    public int Page { get; set; }

    [JsonPropertyName("pageSize")]
    public int PageSize { get; set; }

    [JsonPropertyName("totalPages")]
    public int TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)TotalCount / PageSize) : 0;
}

public class CreateProposalRequestDto
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("categoryId")]
    public int CategoryId { get; set; }

    [JsonPropertyName("provinceId")]
    public int ProvinceId { get; set; }

    [JsonPropertyName("address")]
    public string Address { get; set; } = string.Empty;

    [JsonPropertyName("phone")]
    public string? Phone { get; set; }

    [JsonPropertyName("website")]
    public string? Website { get; set; }

    [JsonPropertyName("openingHours")]
    public string? OpeningHours { get; set; }

    [JsonPropertyName("minPrice")]
    public decimal? MinPrice { get; set; }

    [JsonPropertyName("maxPrice")]
    public decimal? MaxPrice { get; set; }

    [JsonPropertyName("latitude")]
    public decimal? Latitude { get; set; }

    [JsonPropertyName("longitude")]
    public decimal? Longitude { get; set; }

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("coverImg")]
    public string? CoverImg { get; set; }

    [JsonPropertyName("mediaUrls")]
    public List<string>? MediaUrls { get; set; }
}

public class UserBlogItemDto
{
    [JsonPropertyName("id")]
    public long Id { get; set; }

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("excerpt")]
    public string? Excerpt { get; set; }

    [JsonPropertyName("coverImageUrl")]
    public string? CoverImageUrl { get; set; }

    [JsonPropertyName("contentJSON")]
    public string ContentJSON { get; set; } = "{}";

    [JsonPropertyName("categoryId")]
    public int? CategoryId { get; set; }

    [JsonPropertyName("categoryName")]
    public string? CategoryName { get; set; }

    [JsonPropertyName("readTimeMinutes")]
    public int ReadTimeMinutes { get; set; }

    [JsonPropertyName("viewCount")]
    public int ViewCount { get; set; }

    [JsonPropertyName("status")]
    public int Status { get; set; }

    [JsonPropertyName("createdAt")]
    public string CreatedAt { get; set; } = string.Empty;

    [JsonPropertyName("updatedAt")]
    public string UpdatedAt { get; set; } = string.Empty;
}

public class CreateBlogRequestDto
{
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("categoryId")]
    public int? CategoryId { get; set; }

    [JsonPropertyName("coverImageUrl")]
    public string? CoverImageUrl { get; set; }

    [JsonPropertyName("excerpt")]
    public string? Excerpt { get; set; }

    [JsonPropertyName("contentJSON")]
    public string ContentJSON { get; set; } = "{}";

    [JsonPropertyName("readTimeMinutes")]
    public int ReadTimeMinutes { get; set; } = 5;

    [JsonPropertyName("status")]
    public int Status { get; set; } = 1;
}

public class UpdateBlogRequestDto
{
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("categoryId")]
    public int? CategoryId { get; set; }

    [JsonPropertyName("coverImageUrl")]
    public string? CoverImageUrl { get; set; }

    [JsonPropertyName("excerpt")]
    public string? Excerpt { get; set; }

    [JsonPropertyName("contentJSON")]
    public string ContentJSON { get; set; } = "{}";

    [JsonPropertyName("readTimeMinutes")]
    public int ReadTimeMinutes { get; set; } = 5;

    [JsonPropertyName("status")]
    public int Status { get; set; } = 1;
}

public class UserAccessHistoryItemDto
{
    [JsonPropertyName("id")]
    public long Id { get; set; }

    [JsonPropertyName("placeId")]
    public long PlaceId { get; set; }

    [JsonPropertyName("placeName")]
    public string PlaceName { get; set; } = string.Empty;

    [JsonPropertyName("coverImg")]
    public string? CoverImg { get; set; }

    [JsonPropertyName("province")]
    public string? Province { get; set; }

    [JsonPropertyName("avgRating")]
    public double AvgRating { get; set; }

    [JsonPropertyName("viewedAt")]
    public string ViewedAt { get; set; } = string.Empty;
}

public class UserReviewItemDto
{
    [JsonPropertyName("id")]
    public long Id { get; set; }

    [JsonPropertyName("placeId")]
    public long PlaceId { get; set; }

    [JsonPropertyName("placeName")]
    public string PlaceName { get; set; } = string.Empty;

    [JsonPropertyName("rating")]
    public int Rating { get; set; }

    [JsonPropertyName("content")]
    public string? Content { get; set; }

    [JsonPropertyName("visitDate")]
    public string? VisitDate { get; set; }

    [JsonPropertyName("coverImg")]
    public string? CoverImg { get; set; }

    [JsonPropertyName("images")]
    public List<string> Images { get; set; } = new();

    [JsonPropertyName("createdAt")]
    public string CreatedAt { get; set; } = string.Empty;
}

public class UserCommentItemDto
{
    [JsonPropertyName("id")]
    public long Id { get; set; }

    [JsonPropertyName("reviewId")]
    public long ReviewId { get; set; }

    [JsonPropertyName("placeId")]
    public long PlaceId { get; set; }

    [JsonPropertyName("placeName")]
    public string PlaceName { get; set; } = string.Empty;

    [JsonPropertyName("placeThumb")]
    public string? PlaceThumb { get; set; }

    [JsonPropertyName("content")]
    public string Content { get; set; } = string.Empty;

    [JsonPropertyName("parentAuthor")]
    public string? ParentAuthor { get; set; }

    [JsonPropertyName("createdAt")]
    public string CreatedAt { get; set; } = string.Empty;
}
