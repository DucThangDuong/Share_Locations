using System.Globalization;
using Application.DTOs;

namespace Infrastructure.Persistence.Models;

internal sealed class RawBlogRow
{
    public long Id { get; set; }
    public long AuthorId { get; set; }
    public int? CategoryId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Excerpt { get; set; }
    public string ContentJSON { get; set; } = "{}";
    public string? CoverImageUrl { get; set; }
    public int ReadTimeMinutes { get; set; }
    public int ViewCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? AuthorName { get; set; }
    public string? AuthorAvatar { get; set; }
    public string? CategoryName { get; set; }
}

internal static class BlogMappingExtensions
{
    public static BlogListItemDto ToDto(this RawBlogRow b, bool isFeatured = false)
    {
        var slug = Repositories.BlogRepository.GenerateSlug(b.Title);
        var readTime = b.ReadTimeMinutes > 0 ? $"{b.ReadTimeMinutes} phút đọc" : "5 phút đọc";
        var publishedDate = b.CreatedAt.ToString("dd 'Tháng' MM, yyyy", CultureInfo.GetCultureInfo("vi-VN"));

        return new BlogListItemDto
        {
            Id = b.Id,
            Slug = slug,
            Title = b.Title,
            Excerpt = b.Excerpt ?? (b.Title.Length > 80 ? b.Title[..80] + "..." : b.Title),
            Content = b.ContentJSON,
            Category = b.CategoryName ?? "Cẩm nang du lịch",
            ReadTime = readTime,
            CoverUrl = b.CoverImageUrl,
            Author = new BlogAuthorDto
            {
                Name = b.AuthorName ?? "Ban Biên Tập Lang Thang",
                Avatar = b.AuthorAvatar,
                Role = "Travel Blogger"
            },
            PublishedAt = publishedDate,
            Tags = new List<string> { b.CategoryName ?? "Du lịch", "Kinh nghiệm", "Việt Nam" },
            Featured = isFeatured || b.ViewCount > 500
        };
    }
}
