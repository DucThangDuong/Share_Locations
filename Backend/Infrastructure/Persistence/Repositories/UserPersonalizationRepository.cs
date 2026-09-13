using System.Data;
using System.Text.Json;
using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;

namespace Infrastructure.Persistence.Repositories;

public class UserPersonalizationRepository : IUserPersonalizationRepository
{
    private readonly string _connectionString;

    public UserPersonalizationRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("SqlServer")
            ?? configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'SqlServer' or 'DefaultConnection' not found.");
    }

    private IDbConnection CreateConnection() => new SqlConnection(_connectionString);

    public async Task<UserFavoritePagedResultDto> GetFavoritesAsync(
        long userId,
        int? targetType,
        string? keyword,
        string? sortBy,
        int page,
        int pageSize,
        CancellationToken ct = default)
    {
        using var connection = CreateConnection();
        int offset = (page - 1) * pageSize;
        string? pattern = !string.IsNullOrWhiteSpace(keyword) ? $"%{keyword.Trim()}%" : null;

        string orderByClause = sortBy?.ToLowerInvariant() switch
        {
            "rating" => "ORDER BY Rating DESC, SavedDate DESC",
            "name" => "ORDER BY Title ASC, SavedDate DESC",
            _ => "ORDER BY SavedDate DESC"
        };

        string sql = $@"
            WITH FavUnified AS (
                SELECT
                    f.TargetId,
                    CAST(f.TargetType AS INT) AS TargetType,
                    f.CreatedAt AS SavedDate,
                    p.Name AS Title,
                    prov.Name AS Subtitle,
                    COALESCE(p.CoverImageUrl, (SELECT TOP 1 pm.Url FROM dbo.PlaceMedia pm WHERE pm.PlaceId = p.Id ORDER BY pm.DisplayOrder)) AS CoverImg,
                    ISNULL(cat.Name, N'ĐỊA ĐIỂM') AS CategoryTag,
                    CAST(p.AvgRating AS FLOAT) AS Rating,
                    p.ReviewCount,
                    CASE
                        WHEN p.MinPrice IS NOT NULL AND p.MaxPrice IS NOT NULL THEN CONCAT(FORMAT(p.MinPrice, 'N0'), N'đ - ', FORMAT(p.MaxPrice, 'N0'), N'đ')
                        WHEN p.MinPrice IS NOT NULL THEN CONCAT(N'Từ ', FORMAT(p.MinPrice, 'N0'), N'đ')
                        ELSE N'Miễn phí'
                    END AS Price
                FROM dbo.Favorites f
                INNER JOIN dbo.Places p ON f.TargetId = p.Id AND f.TargetType = 1
                LEFT JOIN dbo.Provinces prov ON p.ProvinceId = prov.Id
                LEFT JOIN dbo.Categories cat ON p.CategoryId = cat.Id
                WHERE f.UserId = @UserId

                UNION ALL

                SELECT
                    f.TargetId,
                    CAST(f.TargetType AS INT) AS TargetType,
                    f.CreatedAt AS SavedDate,
                    fd.Name AS Title,
                    ISNULL((SELECT TOP 1 prov.Name FROM dbo.FoodProvinces fp INNER JOIN dbo.Provinces prov ON fp.ProvinceId = prov.Id WHERE fp.FoodId = fd.Id), N'Việt Nam') AS Subtitle,
                    fd.CoverImageUrl AS CoverImg,
                    N'ẨM THỰC' AS CategoryTag,
                    5.0 AS Rating,
                    (SELECT COUNT(1) FROM dbo.FoodPlaces fp2 WHERE fp2.FoodId = fd.Id) AS ReviewCount,
                    NULL AS Price
                FROM dbo.Favorites f
                INNER JOIN dbo.Foods fd ON f.TargetId = fd.Id AND f.TargetType = 2
                WHERE f.UserId = @UserId

                UNION ALL

                SELECT
                    f.TargetId,
                    CAST(f.TargetType AS INT) AS TargetType,
                    f.CreatedAt AS SavedDate,
                    t.Title AS Title,
                    t.Description AS Subtitle,
                    t.CoverImageUrl AS CoverImg,
                    N'HÀNH TRÌNH' AS CategoryTag,
                    5.0 AS Rating,
                    0 AS ReviewCount,
                    NULL AS Price
                FROM dbo.Favorites f
                INNER JOIN dbo.Trips t ON f.TargetId = t.Id AND f.TargetType = 3
                WHERE f.UserId = @UserId

                UNION ALL

                SELECT
                    f.TargetId,
                    CAST(f.TargetType AS INT) AS TargetType,
                    f.CreatedAt AS SavedDate,
                    b.Title AS Title,
                    b.Excerpt AS Subtitle,
                    b.CoverImageUrl AS CoverImg,
                    ISNULL(c.Name, N'BÀI VIẾT') AS CategoryTag,
                    5.0 AS Rating,
                    b.ViewCount AS ReviewCount,
                    NULL AS Price
                FROM dbo.Favorites f
                INNER JOIN dbo.Blogs b ON f.TargetId = b.Id AND f.TargetType = 4
                LEFT JOIN dbo.Categories c ON b.CategoryId = c.Id
                WHERE f.UserId = @UserId
            )
            SELECT
                TargetId,
                TargetType,
                Title,
                Subtitle,
                CoverImg,
                CategoryTag,
                Rating,
                ReviewCount,
                Price,
                SavedDate,
                COUNT(1) OVER() AS TotalCount
            FROM FavUnified
            WHERE (@TargetType IS NULL OR TargetType = @TargetType)
              AND (@Pattern IS NULL OR Title LIKE @Pattern OR Subtitle LIKE @Pattern)
            {orderByClause}
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;";

        var rows = (await connection.QueryAsync(sql, new
        {
            UserId = userId,
            TargetType = targetType,
            Pattern = pattern,
            Offset = offset,
            PageSize = pageSize
        })).ToList();

        long totalCount = rows.Count > 0 ? (long)rows[0].TotalCount : 0;
        var items = new List<UserFavoriteItemDto>();

        foreach (var r in rows)
        {
            DateTime saved = (DateTime)r.SavedDate;
            items.Add(new UserFavoriteItemDto
            {
                Id = (long)r.TargetId,
                TargetId = (long)r.TargetId,
                TargetType = (int)r.TargetType,
                Title = (string)r.Title,
                Subtitle = (string?)r.Subtitle,
                CoverImg = (string?)r.CoverImg,
                CategoryTag = (string)r.CategoryTag,
                Rating = r.Rating != null ? Math.Round((double)r.Rating, 2) : 5.0,
                ReviewCount = (int)(r.ReviewCount ?? 0),
                Price = (string?)r.Price,
                SavedDate = saved.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
            });
        }

        return new UserFavoritePagedResultDto
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public async Task<UserVisitLogPagedResultDto> GetVisitLogsAsync(
        long userId,
        int? privacy,
        int page,
        int pageSize,
        CancellationToken ct = default)
    {
        using var connection = CreateConnection();
        int offset = (page - 1) * pageSize;

        const string sql = @"
            SELECT
                v.Id,
                v.PlaceId,
                p.Name AS PlaceName,
                prov.Name AS Province,
                cat.Name AS Category,
                v.VisitedDate,
                CAST(v.Privacy AS INT) AS Privacy,
                COALESCE(p.CoverImageUrl, (SELECT TOP 1 pm.Url FROM dbo.PlaceMedia pm WHERE pm.PlaceId = p.Id ORDER BY pm.DisplayOrder)) AS CoverImg,
                CAST(p.Latitude AS FLOAT) AS Lat,
                CAST(p.Longitude AS FLOAT) AS Lng,
                v.CreatedAt,
                COUNT(1) OVER() AS TotalCount
            FROM dbo.VisitLogs v
            INNER JOIN dbo.Places p ON v.PlaceId = p.Id
            LEFT JOIN dbo.Provinces prov ON p.ProvinceId = prov.Id
            LEFT JOIN dbo.Categories cat ON p.CategoryId = cat.Id
            WHERE v.UserId = @UserId
              AND (@Privacy IS NULL OR v.Privacy = @Privacy)
            ORDER BY v.VisitedDate DESC, v.CreatedAt DESC
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;";

        var rows = (await connection.QueryAsync(sql, new
        {
            UserId = userId,
            Privacy = privacy,
            Offset = offset,
            PageSize = pageSize
        })).ToList();

        long totalCount = rows.Count > 0 ? (long)rows[0].TotalCount : 0;
        var items = new List<UserVisitLogItemDto>();

        foreach (var r in rows)
        {
            DateTime created = (DateTime)r.CreatedAt;
            var visitedDate = r.VisitedDate is DateOnly d ? d.ToString("yyyy-MM-dd") : ((DateTime)r.VisitedDate).ToString("yyyy-MM-dd");

            items.Add(new UserVisitLogItemDto
            {
                Id = (long)r.Id,
                PlaceId = (long)r.PlaceId,
                PlaceName = (string)r.PlaceName,
                Province = (string?)r.Province,
                Category = (string?)r.Category,
                VisitedDate = visitedDate,
                Privacy = (int)r.Privacy,
                CoverImg = (string?)r.CoverImg,
                Lat = r.Lat != null ? (double)r.Lat : null,
                Lng = r.Lng != null ? (double)r.Lng : null,
                CreatedAt = created.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
            });
        }

        return new UserVisitLogPagedResultDto
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<UserProposalPagedResultDto> GetProposalsAsync(
        long userId,
        int? status,
        int page,
        int pageSize,
        CancellationToken ct = default)
    {
        using var connection = CreateConnection();
        int offset = (page - 1) * pageSize;

        const string sql = @"
            SELECT
                pr.Id,
                pr.ProposedDataJSON,
                CAST(pr.Status AS INT) AS Status,
                pr.RejectReason,
                pr.CreatedAt,
                COUNT(1) OVER() AS TotalCount
            FROM dbo.Proposals pr
            WHERE pr.UserId = @UserId
              AND (@Status IS NULL OR pr.Status = @Status)
            ORDER BY pr.CreatedAt DESC
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;";

        var rows = (await connection.QueryAsync(sql, new
        {
            UserId = userId,
            Status = status,
            Offset = offset,
            PageSize = pageSize
        })).ToList();

        long totalCount = rows.Count > 0 ? (long)rows[0].TotalCount : 0;
        var items = new List<UserProposalItemDto>();

        foreach (var r in rows)
        {
            DateTime created = (DateTime)r.CreatedAt;
            string rawJson = (string)(r.ProposedDataJSON ?? "{}");

            string name = string.Empty;
            string address = string.Empty;
            string? category = null;
            string? province = null;
            string? openingHours = null;
            decimal? minPrice = null;
            decimal? maxPrice = null;
            string? description = null;
            string? coverImg = null;
            var mediaUrls = new List<string>();

            try
            {
                using var doc = JsonDocument.Parse(rawJson);
                var root = doc.RootElement;

                if (root.TryGetProperty("name", out var pName)) name = pName.GetString() ?? string.Empty;
                if (root.TryGetProperty("address", out var pAddr)) address = pAddr.GetString() ?? string.Empty;
                if (root.TryGetProperty("openingHours", out var pOpen)) openingHours = pOpen.GetString();
                if (root.TryGetProperty("description", out var pDesc)) description = pDesc.GetString();
                if (root.TryGetProperty("coverImg", out var pCover)) coverImg = pCover.GetString();

                if (root.TryGetProperty("minPrice", out var pMin) && pMin.TryGetDecimal(out var dMin)) minPrice = dMin;
                if (root.TryGetProperty("maxPrice", out var pMax) && pMax.TryGetDecimal(out var dMax)) maxPrice = dMax;

                if (root.TryGetProperty("mediaUrls", out var pMedias) && pMedias.ValueKind == JsonValueKind.Array)
                {
                    foreach (var m in pMedias.EnumerateArray())
                    {
                        var u = m.GetString();
                        if (!string.IsNullOrWhiteSpace(u)) mediaUrls.Add(u);
                    }
                }
            }
            catch
            {
                // Fallback on JSON parse error
            }

            items.Add(new UserProposalItemDto
            {
                Id = (long)r.Id,
                Name = !string.IsNullOrWhiteSpace(name) ? name : $"Đề xuất #{r.Id}",
                Category = category,
                Province = province,
                Address = address,
                OpeningHours = openingHours,
                MinPrice = minPrice,
                MaxPrice = maxPrice,
                Description = description,
                CoverImg = coverImg,
                MediaUrls = mediaUrls,
                Status = (int)r.Status,
                RejectReason = (string?)r.RejectReason,
                CreatedAt = created.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
            });
        }

        return new UserProposalPagedResultDto
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<IReadOnlyList<UserAccessHistoryItemDto>> GetAccessHistoriesAsync(
        long userId,
        int limit,
        CancellationToken ct = default)
    {
        using var connection = CreateConnection();

        const string sql = @"
            SELECT TOP (@Limit)
                a.Id,
                a.PlaceId,
                p.Name AS PlaceName,
                COALESCE(p.CoverImageUrl, (SELECT TOP 1 pm.Url FROM dbo.PlaceMedia pm WHERE pm.PlaceId = p.Id ORDER BY pm.DisplayOrder)) AS CoverImg,
                prov.Name AS Province,
                CAST(p.AvgRating AS FLOAT) AS AvgRating,
                a.ViewedAt
            FROM dbo.AccessHistories a
            INNER JOIN dbo.Places p ON a.PlaceId = p.Id
            LEFT JOIN dbo.Provinces prov ON p.ProvinceId = prov.Id
            WHERE a.UserId = @UserId
            ORDER BY a.ViewedAt DESC;";

        var rows = (await connection.QueryAsync(sql, new { UserId = userId, Limit = limit })).ToList();
        var list = new List<UserAccessHistoryItemDto>();

        foreach (var r in rows)
        {
            DateTime viewed = (DateTime)r.ViewedAt;
            list.Add(new UserAccessHistoryItemDto
            {
                Id = (long)r.Id,
                PlaceId = (long)r.PlaceId,
                PlaceName = (string)r.PlaceName,
                CoverImg = (string?)r.CoverImg,
                Province = (string?)r.Province,
                AvgRating = r.AvgRating != null ? Math.Round((double)r.AvgRating, 2) : 5.0,
                ViewedAt = viewed.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
            });
        }

        return list;
    }

    public async Task<PagedResult<UserReviewItemDto>> GetReviewsAsync(
        long userId,
        int page,
        int pageSize,
        CancellationToken ct = default)
    {
        using var connection = CreateConnection();
        int offset = (page - 1) * pageSize;

        const string sql = @"
            SELECT
                r.Id,
                r.PlaceId,
                p.Name AS PlaceName,
                CAST(r.Rating AS INT) AS Rating,
                r.Content,
                r.VisitDate,
                COALESCE(p.CoverImageUrl, (SELECT TOP 1 pm.Url FROM dbo.PlaceMedia pm WHERE pm.PlaceId = p.Id ORDER BY pm.DisplayOrder)) AS CoverImg,
                r.CreatedAt,
                COUNT(1) OVER() AS TotalCount
            FROM dbo.Reviews r
            INNER JOIN dbo.Places p ON r.PlaceId = p.Id
            WHERE r.UserId = @UserId AND r.Status = 1
            ORDER BY r.CreatedAt DESC
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;";

        var rows = (await connection.QueryAsync(sql, new
        {
            UserId = userId,
            Offset = offset,
            PageSize = pageSize
        })).ToList();

        long totalCount = rows.Count > 0 ? (long)rows[0].TotalCount : 0;
        var list = new List<UserReviewItemDto>();

        if (rows.Count > 0)
        {
            var reviewIds = rows.Select(r => (long)r.Id).ToList();
            const string mediaSql = @"
                SELECT rm.ReviewId, rm.Url
                FROM dbo.ReviewMedia rm
                WHERE rm.ReviewId IN @ReviewIds
                ORDER BY rm.Id;";

            var mediaRows = (await connection.QueryAsync(mediaSql, new { ReviewIds = reviewIds })).ToList();
            var mediaLookup = mediaRows.Where(m => m.Url != null).ToLookup(m => (long)m.ReviewId, m => (string)m.Url);

            foreach (var r in rows)
            {
                var rid = (long)r.Id;
                DateTime created = (DateTime)r.CreatedAt;
                string? vDate = null;
                if (r.VisitDate != null)
                {
                    vDate = r.VisitDate is DateOnly d ? d.ToString("yyyy-MM-dd") : ((DateTime)r.VisitDate).ToString("yyyy-MM-dd");
                }

                list.Add(new UserReviewItemDto
                {
                    Id = rid,
                    PlaceId = (long)r.PlaceId,
                    PlaceName = (string)r.PlaceName,
                    Rating = (int)r.Rating,
                    Content = (string?)r.Content,
                    VisitDate = vDate,
                    CoverImg = (string?)r.CoverImg,
                    Images = mediaLookup[rid].Distinct().ToList(),
                    CreatedAt = created.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
                });
            }
        }

        return new PagedResult<UserReviewItemDto>(list, totalCount, page, pageSize);
    }

    public async Task<PagedResult<UserCommentItemDto>> GetCommentsAsync(
        long userId,
        int page,
        int pageSize,
        CancellationToken ct = default)
    {
        using var connection = CreateConnection();
        int offset = (page - 1) * pageSize;

        const string sql = @"
            SELECT
                c.Id,
                c.ReviewId,
                r.PlaceId,
                p.Name AS PlaceName,
                COALESCE(p.CoverImageUrl, (SELECT TOP 1 pm.Url FROM dbo.PlaceMedia pm WHERE pm.PlaceId = p.Id ORDER BY pm.DisplayOrder)) AS PlaceThumb,
                c.Content,
                ISNULL(pup.FullName, pu.Email) AS ParentAuthor,
                c.CreatedAt,
                COUNT(1) OVER() AS TotalCount
            FROM dbo.Comments c
            INNER JOIN dbo.Reviews r ON c.ReviewId = r.Id
            INNER JOIN dbo.Places p ON r.PlaceId = p.Id
            LEFT JOIN dbo.Comments parent ON c.ParentId = parent.Id
            LEFT JOIN dbo.Users pu ON parent.UserId = pu.Id
            LEFT JOIN dbo.UserProfiles pup ON pu.Id = pup.UserId
            WHERE c.UserId = @UserId AND c.Status = 1
            ORDER BY c.CreatedAt DESC
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;";

        var rows = (await connection.QueryAsync(sql, new
        {
            UserId = userId,
            Offset = offset,
            PageSize = pageSize
        })).ToList();

        long totalCount = rows.Count > 0 ? (long)rows[0].TotalCount : 0;
        var list = new List<UserCommentItemDto>();

        foreach (var r in rows)
        {
            DateTime created = (DateTime)r.CreatedAt;
            list.Add(new UserCommentItemDto
            {
                Id = (long)r.Id,
                ReviewId = (long)r.ReviewId,
                PlaceId = (long)r.PlaceId,
                PlaceName = (string)r.PlaceName,
                PlaceThumb = (string?)r.PlaceThumb,
                Content = (string)r.Content,
                ParentAuthor = (string?)r.ParentAuthor,
                CreatedAt = created.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
            });
        }

        return new PagedResult<UserCommentItemDto>(list, totalCount, page, pageSize);
    }

    public async Task<PagedResult<UserBlogItemDto>> GetBlogsAsync(
        long userId,
        int? status,
        int page,
        int pageSize,
        CancellationToken ct = default)
    {
        using var connection = CreateConnection();
        int offset = (page - 1) * pageSize;

        const string sql = @"
            SELECT
                b.Id,
                b.Title,
                b.Excerpt,
                b.CoverImageUrl,
                b.ContentJSON,
                b.CategoryId,
                cat.Name AS CategoryName,
                b.ReadTimeMinutes,
                b.ViewCount,
                CAST(b.Status AS INT) AS Status,
                b.CreatedAt,
                b.UpdatedAt,
                COUNT(1) OVER() AS TotalCount
            FROM dbo.Blogs b
            LEFT JOIN dbo.Categories cat ON b.CategoryId = cat.Id
            WHERE b.AuthorId = @UserId
              AND (@Status IS NULL OR b.Status = @Status)
            ORDER BY b.CreatedAt DESC
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;";

        var rows = (await connection.QueryAsync(sql, new
        {
            UserId = userId,
            Status = status,
            Offset = offset,
            PageSize = pageSize
        })).ToList();

        long totalCount = rows.Count > 0 ? (long)rows[0].TotalCount : 0;
        var list = new List<UserBlogItemDto>();

        foreach (var r in rows)
        {
            DateTime created = (DateTime)r.CreatedAt;
            DateTime updated = (DateTime)r.UpdatedAt;

            list.Add(new UserBlogItemDto
            {
                Id = (long)r.Id,
                Title = (string)r.Title,
                Excerpt = (string?)r.Excerpt,
                CoverImageUrl = (string?)r.CoverImageUrl,
                ContentJSON = (string)(r.ContentJSON ?? "{}"),
                CategoryId = (int?)r.CategoryId,
                CategoryName = (string?)r.CategoryName,
                ReadTimeMinutes = (int)(r.ReadTimeMinutes ?? 5),
                ViewCount = (int)(r.ViewCount ?? 0),
                Status = (int)r.Status,
                CreatedAt = created.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
                UpdatedAt = updated.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
            });
        }

        return new PagedResult<UserBlogItemDto>(list, totalCount, page, pageSize);
    }
}
