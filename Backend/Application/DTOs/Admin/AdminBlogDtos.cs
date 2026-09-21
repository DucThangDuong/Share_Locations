namespace Application.DTOs.Admin;

public class AdminBlogListItemDto
{
    public long Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string AuthorName { get; set; } = string.Empty;
    public string? AuthorAvatar { get; set; }
    public string? Category { get; set; }
    public int? CategoryId { get; set; }
    public DateTime PublishedAt { get; set; }
    public int Views { get; set; }
    public string Status { get; set; } = "published"; // "published" | "draft" | "hidden"
    public string? CoverImg { get; set; }
    public string ReadTime { get; set; } = "5 phút đọc";
    public string? Summary { get; set; }
}

public class AdminBlogDetailDto : AdminBlogListItemDto
{
    public string Content { get; set; } = string.Empty;
    public long AuthorId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateAdminBlogInput
{
    public string Title { get; set; } = string.Empty;
    public int? CategoryId { get; set; }
    public string? Summary { get; set; }
    public string Content { get; set; } = string.Empty;
    public string? CoverImg { get; set; }
    public int ReadTimeMinutes { get; set; } = 5;
    public string Status { get; set; } = "published";
}

public class UpdateAdminBlogInput
{
    public string Title { get; set; } = string.Empty;
    public int? CategoryId { get; set; }
    public string? Summary { get; set; }
    public string Content { get; set; } = string.Empty;
    public string? CoverImg { get; set; }
    public int ReadTimeMinutes { get; set; } = 5;
    public string Status { get; set; } = "published";
}

public class UpdateBlogStatusInput
{
    public string Status { get; set; } = "published"; // "published" | "draft" | "hidden"
}
