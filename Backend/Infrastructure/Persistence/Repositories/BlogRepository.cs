using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using Dapper;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class BlogRepository : IBlogRepository
{
    private readonly TravelReviewDbContext _dbContext;

    public BlogRepository(TravelReviewDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    private class RawBlogRow
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

    public static string GenerateSlug(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return string.Empty;

        var normalizedString = text.Normalize(NormalizationForm.FormD);
        var stringBuilder = new StringBuilder();

        foreach (var c in normalizedString)
        {
            var unicodeCategory = CharUnicodeInfo.GetUnicodeCategory(c);
            if (unicodeCategory != UnicodeCategory.NonSpacingMark)
            {
                stringBuilder.Append(c);
            }
        }

        var clean = stringBuilder.ToString().Normalize(NormalizationForm.FormC).ToLowerInvariant();
        clean = clean.Replace("đ", "d").Replace("Đ", "d");
        clean = Regex.Replace(clean, @"[^a-z0-9\s-]", "");
        clean = Regex.Replace(clean, @"\s+", "-").Trim('-');
        return clean;
    }

    private static BlogListItemDto MapToDto(RawBlogRow b, bool isFeatured = false)
    {
        var slug = GenerateSlug(b.Title);
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

    public async Task<IReadOnlyList<BlogListItemDto>> GetBlogsAsync(
        string? category,
        string? keyword,
        int page,
        int pageSize,
        CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        var conditions = new List<string> { "b.Status = 1" };
        var parameters = new DynamicParameters();

        if (!string.IsNullOrWhiteSpace(category))
        {
            conditions.Add("c.Name LIKE @Category");
            parameters.Add("Category", $"%{category.Trim()}%");
        }

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            conditions.Add("(b.Title LIKE @Keyword OR b.Excerpt LIKE @Keyword)");
            parameters.Add("Keyword", $"%{keyword.Trim()}%");
        }

        var whereClause = string.Join(" AND ", conditions);
        var offset = Math.Max(0, (page - 1) * pageSize);
        parameters.Add("Offset", offset);
        parameters.Add("PageSize", Math.Max(1, pageSize));

        var sql = $@"
            SELECT 
                b.Id,
                b.AuthorId,
                b.CategoryId,
                b.Title,
                b.Excerpt,
                b.ContentJSON,
                b.CoverImageUrl,
                b.ReadTimeMinutes,
                b.ViewCount,
                b.CreatedAt,
                ISNULL(up.FullName, N'Lang Thang Blogger') AS AuthorName,
                up.AvatarUrl AS AuthorAvatar,
                c.Name AS CategoryName
            FROM dbo.Blogs b
            LEFT JOIN dbo.UserProfiles up ON b.AuthorId = up.UserId
            LEFT JOIN dbo.Categories c ON b.CategoryId = c.Id
            WHERE {whereClause}
            ORDER BY b.CreatedAt DESC
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;";

        var rows = (await connection.QueryAsync<RawBlogRow>(sql, parameters)).ToList();
        return rows.Select(r => MapToDto(r)).ToList();
    }

    public async Task<BlogListItemDto?> GetFeaturedBlogAsync(CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        const string sql = @"
            SELECT TOP 1
                b.Id,
                b.AuthorId,
                b.CategoryId,
                b.Title,
                b.Excerpt,
                b.ContentJSON,
                b.CoverImageUrl,
                b.ReadTimeMinutes,
                b.ViewCount,
                b.CreatedAt,
                ISNULL(up.FullName, N'Lang Thang Blogger') AS AuthorName,
                up.AvatarUrl AS AuthorAvatar,
                c.Name AS CategoryName
            FROM dbo.Blogs b
            LEFT JOIN dbo.UserProfiles up ON b.AuthorId = up.UserId
            LEFT JOIN dbo.Categories c ON b.CategoryId = c.Id
            WHERE b.Status = 1
            ORDER BY b.ViewCount DESC, b.CreatedAt DESC;";

        var row = await connection.QueryFirstOrDefaultAsync<RawBlogRow>(sql);
        return row != null ? MapToDto(row, isFeatured: true) : null;
    }

    public async Task<BlogDetailDto?> GetBlogDetailAsync(string idOrSlug, CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        RawBlogRow? blog = null;
        if (long.TryParse(idOrSlug, out var blogId))
        {
            const string sqlById = @"
                SELECT 
                    b.Id,
                    b.AuthorId,
                    b.CategoryId,
                    b.Title,
                    b.Excerpt,
                    b.ContentJSON,
                    b.CoverImageUrl,
                    b.ReadTimeMinutes,
                    b.ViewCount,
                    b.CreatedAt,
                    ISNULL(up.FullName, N'Lang Thang Blogger') AS AuthorName,
                    up.AvatarUrl AS AuthorAvatar,
                    c.Name AS CategoryName
                FROM dbo.Blogs b
                LEFT JOIN dbo.UserProfiles up ON b.AuthorId = up.UserId
                LEFT JOIN dbo.Categories c ON b.CategoryId = c.Id
                WHERE b.Id = @Id AND b.Status = 1;";

            blog = await connection.QueryFirstOrDefaultAsync<RawBlogRow>(sqlById, new { Id = blogId });
        }
        else
        {
            // Match all published blogs and find matching slug
            const string sqlAll = @"
                SELECT 
                    b.Id,
                    b.AuthorId,
                    b.CategoryId,
                    b.Title,
                    b.Excerpt,
                    b.ContentJSON,
                    b.CoverImageUrl,
                    b.ReadTimeMinutes,
                    b.ViewCount,
                    b.CreatedAt,
                    ISNULL(up.FullName, N'Lang Thang Blogger') AS AuthorName,
                    up.AvatarUrl AS AuthorAvatar,
                    c.Name AS CategoryName
                FROM dbo.Blogs b
                LEFT JOIN dbo.UserProfiles up ON b.AuthorId = up.UserId
                LEFT JOIN dbo.Categories c ON b.CategoryId = c.Id
                WHERE b.Status = 1;";

            var all = (await connection.QueryAsync<RawBlogRow>(sqlAll)).ToList();
            blog = all.FirstOrDefault(b => GenerateSlug(b.Title).Equals(idOrSlug, StringComparison.OrdinalIgnoreCase));
        }

        if (blog == null) return null;

        // Increase view count asynchronously
        _ = connection.ExecuteAsync("UPDATE dbo.Blogs SET ViewCount = ViewCount + 1 WHERE Id = @Id;", new { Id = blog.Id });

        // Query related posts
        const string relatedSql = @"
            SELECT TOP 3
                b.Id,
                b.AuthorId,
                b.CategoryId,
                b.Title,
                b.Excerpt,
                b.ContentJSON,
                b.CoverImageUrl,
                b.ReadTimeMinutes,
                b.ViewCount,
                b.CreatedAt,
                ISNULL(up.FullName, N'Lang Thang Blogger') AS AuthorName,
                up.AvatarUrl AS AuthorAvatar,
                c.Name AS CategoryName
            FROM dbo.Blogs b
            LEFT JOIN dbo.UserProfiles up ON b.AuthorId = up.UserId
            LEFT JOIN dbo.Categories c ON b.CategoryId = c.Id
            WHERE b.Id <> @CurrentId AND b.Status = 1
            ORDER BY b.ViewCount DESC, b.CreatedAt DESC;";

        var relatedRows = (await connection.QueryAsync<RawBlogRow>(relatedSql, new { CurrentId = blog.Id })).ToList();
        var baseDto = MapToDto(blog);

        return new BlogDetailDto
        {
            Id = baseDto.Id,
            Slug = baseDto.Slug,
            Title = baseDto.Title,
            Excerpt = baseDto.Excerpt,
            Content = baseDto.Content,
            Category = baseDto.Category,
            ReadTime = baseDto.ReadTime,
            CoverUrl = baseDto.CoverUrl,
            Author = baseDto.Author,
            PublishedAt = baseDto.PublishedAt,
            Tags = baseDto.Tags,
            Featured = baseDto.Featured,
            RelatedPosts = relatedRows.Select(r => MapToDto(r)).ToList()
        };
    }
}
