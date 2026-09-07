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
