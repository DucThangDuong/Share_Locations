namespace Application.DTOs;

public class BlogAuthorDto
{
    public string Name { get; set; } = string.Empty;
    public string? Avatar { get; set; }
    public string Role { get; set; } = "Travel Blogger";
}

public class BlogListItemDto
{
    public long Id { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Excerpt { get; set; }
    public string Content { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string ReadTime { get; set; } = "5 phút đọc";
    public string? CoverUrl { get; set; }
    public BlogAuthorDto Author { get; set; } = new();
    public string PublishedAt { get; set; } = string.Empty;
    public IReadOnlyList<string> Tags { get; set; } = [];
    public bool Featured { get; set; }
}

public class BlogDetailDto : BlogListItemDto
{
}

public class BlogLikeResponseDto
{
    public bool IsLiked { get; set; }
    public int LikesCount { get; set; }
}

public class BlogFilterParams
{
    public string? Category { get; set; }
    public int? CategoryId { get; set; }
    public List<int>? CategoryIds { get; set; }
    public int? PlaceTypeId { get; set; }
    public List<int>? PlaceTypeIds { get; set; }
    public string? Keyword { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 9;

    public List<int> GetEffectiveCategoryIds()
    {
        var result = new HashSet<int>();
        if (CategoryIds != null)
        {
            foreach (var id in CategoryIds) if (id > 0) result.Add(id);
        }
        if (CategoryId.HasValue && CategoryId.Value > 0)
        {
            result.Add(CategoryId.Value);
        }
        return result.ToList();
    }

    public List<int> GetEffectivePlaceTypeIds()
    {
        var result = new HashSet<int>();
        if (PlaceTypeIds != null)
        {
            foreach (var id in PlaceTypeIds) if (id > 0) result.Add(id);
        }
        if (PlaceTypeId.HasValue && PlaceTypeId.Value > 0)
        {
            result.Add(PlaceTypeId.Value);
        }
        return result.ToList();
    }
}

public class BlogForEditDto
{
    public long Id { get; set; }
    public long AuthorId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? Excerpt { get; set; }
    public string ContentJSON { get; set; } = "{}";
    public string? CoverImageUrl { get; set; }
    public int? CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public int ReadTimeMinutes { get; set; } = 5;
    public int ViewCount { get; set; }
    public int Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

