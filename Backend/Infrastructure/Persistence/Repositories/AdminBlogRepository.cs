using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs.Admin;
using Dapper;
using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class AdminBlogRepository : IAdminBlogRepository
{
    private readonly TravelReviewDbContext _dbContext;

    public AdminBlogRepository(TravelReviewDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<PagedResult<AdminBlogListItemDto>> GetAdminBlogsAsync(
        int? categoryId,
        string? status,
        string? keyword,
        int page,
        int pageSize,
        CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        var whereClauses = new List<string>();
        var parameters = new DynamicParameters();

        if (categoryId.HasValue && categoryId.Value > 0)
        {
            whereClauses.Add("b.CategoryId = @CategoryId");
            parameters.Add("CategoryId", categoryId.Value);
        }

        if (!string.IsNullOrWhiteSpace(status) && status.ToLowerInvariant() != "all")
        {
            if (status.Equals("published", StringComparison.OrdinalIgnoreCase))
                whereClauses.Add("b.Status = 1");
            else if (status.Equals("draft", StringComparison.OrdinalIgnoreCase))
                whereClauses.Add("b.Status = 0");
            else if (status.Equals("hidden", StringComparison.OrdinalIgnoreCase))
                whereClauses.Add("b.Status = 2");
        }

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            whereClauses.Add("(b.Title LIKE @Keyword OR b.Excerpt LIKE @Keyword OR COALESCE(prof.FullName, u.Email) LIKE @Keyword)");
            parameters.Add("Keyword", $"%{keyword.Trim()}%");
        }

        var whereSql = whereClauses.Count > 0 ? " WHERE " + string.Join(" AND ", whereClauses) : "";

        var countSql = $@"
            SELECT COUNT(1)
            FROM dbo.Blogs b
            LEFT JOIN dbo.Users u ON b.AuthorId = u.Id
            LEFT JOIN dbo.UserProfiles prof ON u.Id = prof.UserId
            {whereSql};";

        var totalCount = await connection.ExecuteScalarAsync<int>(countSql, parameters);

        var offset = (page - 1) * pageSize;
        parameters.Add("Offset", offset);
        parameters.Add("PageSize", pageSize);

        var dataSql = $@"
            SELECT 
                b.Id,
                b.Title,
                COALESCE(prof.FullName, u.Email, N'Người dùng') AS AuthorName,
                prof.AvatarUrl AS AuthorAvatar,
                cat.Name AS Category,
                b.CategoryId,
                b.CreatedAt AS PublishedAt,
                b.ViewCount AS Views,
                CASE 
                    WHEN b.Status = 1 THEN 'published'
                    WHEN b.Status = 0 THEN 'draft'
                    ELSE 'hidden'
                END AS Status,
                b.CoverImageUrl AS CoverImg,
                CONCAT(b.ReadTimeMinutes, N' phút đọc') AS ReadTime,
                b.Excerpt AS Summary
            FROM dbo.Blogs b
            LEFT JOIN dbo.Categories cat ON b.CategoryId = cat.Id
            LEFT JOIN dbo.Users u ON b.AuthorId = u.Id
            LEFT JOIN dbo.UserProfiles prof ON u.Id = prof.UserId
            {whereSql}
            ORDER BY b.CreatedAt DESC
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;";

        var items = (await connection.QueryAsync<AdminBlogListItemDto>(dataSql, parameters)).ToList();
        return new PagedResult<AdminBlogListItemDto>(items, totalCount, page, pageSize);
    }

    public async Task<AdminBlogDetailDto?> GetAdminBlogDetailAsync(long id, CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        const string sql = @"
            SELECT 
                b.Id,
                b.Title,
                COALESCE(prof.FullName, u.Email, N'Người dùng') AS AuthorName,
                prof.AvatarUrl AS AuthorAvatar,
                cat.Name AS Category,
                b.CategoryId,
                b.CreatedAt AS PublishedAt,
                b.ViewCount AS Views,
                CASE 
                    WHEN b.Status = 1 THEN 'published'
                    WHEN b.Status = 0 THEN 'draft'
                    ELSE 'hidden'
                END AS Status,
                b.CoverImageUrl AS CoverImg,
                CONCAT(b.ReadTimeMinutes, N' phút đọc') AS ReadTime,
                b.Excerpt AS Summary,
                b.ContentJSON AS Content,
                b.AuthorId,
                b.CreatedAt,
                b.UpdatedAt
            FROM dbo.Blogs b
            LEFT JOIN dbo.Categories cat ON b.CategoryId = cat.Id
            LEFT JOIN dbo.Users u ON b.AuthorId = u.Id
            LEFT JOIN dbo.UserProfiles prof ON u.Id = prof.UserId
            WHERE b.Id = @Id;";

        return await connection.QueryFirstOrDefaultAsync<AdminBlogDetailDto>(sql, new { Id = id });
    }

    public async Task<long> CreateAdminBlogAsync(CreateAdminBlogInput input, long authorId, CancellationToken ct = default)
    {
        var status = input.Status.Equals("draft", StringComparison.OrdinalIgnoreCase)
            ? BlogStatus.Draft
            : (input.Status.Equals("hidden", StringComparison.OrdinalIgnoreCase) ? BlogStatus.Archived : BlogStatus.Published);

        var blog = new Blog(
            authorId: authorId,
            title: input.Title,
            excerpt: input.Summary,
            contentJson: input.Content,
            coverImageUrl: input.CoverImg,
            categoryId: input.CategoryId,
            readTimeMinutes: input.ReadTimeMinutes,
            status: status);

        _dbContext.Blogs.Add(blog);
        await _dbContext.SaveChangesAsync(ct);
        return blog.Id;
    }

    public async Task<bool> UpdateAdminBlogAsync(long id, UpdateAdminBlogInput input, CancellationToken ct = default)
    {
        var blog = await _dbContext.Blogs.FirstOrDefaultAsync(b => b.Id == id, ct);
        if (blog == null) return false;

        var status = input.Status.Equals("draft", StringComparison.OrdinalIgnoreCase)
            ? BlogStatus.Draft
            : (input.Status.Equals("hidden", StringComparison.OrdinalIgnoreCase) ? BlogStatus.Archived : BlogStatus.Published);

        blog.Update(
            title: input.Title,
            excerpt: input.Summary,
            contentJson: input.Content,
            coverImageUrl: input.CoverImg,
            categoryId: input.CategoryId,
            readTimeMinutes: input.ReadTimeMinutes,
            status: status);

        await _dbContext.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> UpdateAdminBlogStatusAsync(long id, string status, CancellationToken ct = default)
    {
        var blog = await _dbContext.Blogs.FirstOrDefaultAsync(b => b.Id == id, ct);
        if (blog == null) return false;

        var blogStatus = status.Equals("draft", StringComparison.OrdinalIgnoreCase)
            ? BlogStatus.Draft
            : (status.Equals("hidden", StringComparison.OrdinalIgnoreCase) ? BlogStatus.Archived : BlogStatus.Published);

        blog.UpdateStatus(blogStatus);
        await _dbContext.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> DeleteAdminBlogAsync(long id, CancellationToken ct = default)
    {
        var blog = await _dbContext.Blogs.FirstOrDefaultAsync(b => b.Id == id, ct);
        if (blog == null) return false;

        _dbContext.Blogs.Remove(blog);
        await _dbContext.SaveChangesAsync(ct);
        return true;
    }
}
