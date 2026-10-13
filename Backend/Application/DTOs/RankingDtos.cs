namespace Application.DTOs;

public class RankingOverviewCategoryDto
{
    public string Key { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public int? PlaceTypeId { get; set; }
    public string? Title { get; set; }
    public string? VietnameseTitle { get; set; }
    public string? CoverImageUrl { get; set; }
}

public class RankingOverviewDto
{
    public string? Title { get; set; }
    public string? Subtitle { get; set; }
    public IReadOnlyList<RankingOverviewCategoryDto> Categories { get; set; } = [];
}

public class RankingDetailHeaderDto
{
    public string? Title { get; set; }
    public string? Subtitle { get; set; }
    public string? CoverImageUrl { get; set; }
    public string? Badge { get; set; }
    public string? TargetName { get; set; }
}

public class RankingSubCategoryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Code { get; set; }
    public string? Slug { get; set; }
    public int PlaceCount { get; set; }
}

public class RankingProvinceOptionDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int RegionId { get; set; }
    public string RegionName { get; set; } = string.Empty;
}

public class RankingReviewSnippetDto
{
    public long ReviewId { get; set; }
    public string AuthorName { get; set; } = string.Empty;
    public string? AuthorAvatar { get; set; }
    public decimal Rating { get; set; }
    public string Content { get; set; } = string.Empty;
    public int LikesCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class RankingPlaceItemDto
{
    public int Rank { get; set; }
    public string? Badge { get; set; }
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Address { get; set; }
    public int ProvinceId { get; set; }
    public string ProvinceName { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public int PlaceTypeId { get; set; }
    public string PlaceTypeName { get; set; } = string.Empty;
    public string? CoverImageUrl { get; set; }
    public decimal AvgRating { get; set; }
    public int ReviewCount { get; set; }
    public int ViewCount { get; set; }
    public int FavoritesCount { get; set; }
    public double Score { get; set; }
    public List<string> GreatThingsToDo { get; set; } = [];
    public RankingReviewSnippetDto? FeaturedReview { get; set; }
}

public class RankingDetailViewDto
{
    public RankingDetailHeaderDto Header { get; set; } = new();
    public IReadOnlyList<RankingSubCategoryDto> SubCategories { get; set; } = [];
    public IReadOnlyList<RankingProvinceOptionDto> AvailableProvinces { get; set; } = [];
    public IReadOnlyList<DestinationRankingItemDto> ProvinceItems { get; set; } = [];
    public IReadOnlyList<RankingPlaceItemDto> Items { get; set; } = [];
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public int TotalCount { get; set; }
    public int TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)TotalCount / PageSize) : 0;
}

public class PlaceRankingItemDto
{
    public int Rank { get; set; }
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public int ProvinceId { get; set; }
    public string ProvinceName { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public int PlaceTypeId { get; set; }
    public string PlaceTypeName { get; set; } = string.Empty;
    public string? ThumbnailUrl { get; set; }
    public decimal AvgRating { get; set; }
    public int ReviewCount { get; set; }
    public int ViewCount { get; set; }
    public int FavoritesCount { get; set; }
    public double Score { get; set; }
    public string? Badge { get; set; }
}

public class ProvinceRankingItemDto
{
    public int Rank { get; set; }
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? Tagline { get; set; }
    public string? ImageUrl { get; set; }
    public int RegionId { get; set; }
    public string RegionName { get; set; } = string.Empty;
    public int TotalPlaces { get; set; }
    public int TotalReviews { get; set; }
    public decimal AvgRating { get; set; }
    public double Score { get; set; }
    public string? Badge { get; set; }
}

public class DestinationFeaturedStoryDto
{
    public long Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? CoverImageUrl { get; set; }
    public string? Excerpt { get; set; }
    public int ReadTimeMinutes { get; set; }
}

public class DestinationRankingItemDto
{
    public int Rank { get; set; }
    public string? Badge { get; set; }
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? Tagline { get; set; }
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public int RegionId { get; set; }
    public string RegionName { get; set; } = string.Empty;
    public int TotalPlaces { get; set; }
    public int TotalReviews { get; set; }
    public decimal AvgRating { get; set; }
    public double Score { get; set; }
    public List<string> GreatThingsToDo { get; set; } = [];
    public DestinationFeaturedStoryDto? FeaturedStory { get; set; }
    public List<PlaceRankingItemDto> AwardWinningPlaces { get; set; } = [];
}
