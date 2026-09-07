using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using Dapper;
using Infrastructure.Persistence;
using Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class BlogRepository : IBlogRepository
{
    private readonly TravelReviewDbContext _dbContext;

    public BlogRepository(TravelReviewDbContext dbContext)
    {
        _dbContext = dbContext;
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
        return rows.Select(r => r.ToDto()).ToList();
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
        return row != null ? row.ToDto(isFeatured: true) : null;
    }

    public async Task<BlogDetailDto?> GetBlogDetailAsync(string idOrSlug, CancellationToken ct = default){
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

        _ = connection.ExecuteAsync("UPDATE dbo.Blogs SET ViewCount = ViewCount + 1 WHERE Id = @Id;", new { Id = blog.Id });

        var baseDto = blog.ToDto();
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
            Featured = baseDto.Featured
        };
    }
}
