using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs.Admin;
using Dapper;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class AdminCatalogTaxonomyRepository : IAdminCatalogTaxonomyRepository
{
    private readonly TravelReviewDbContext _dbContext;
    private readonly IAuditLogService _auditLogService;

    public AdminCatalogTaxonomyRepository(
        TravelReviewDbContext dbContext,
        IAuditLogService auditLogService)
    {
        _dbContext = dbContext;
        _auditLogService = auditLogService;
    }

    // ==========================================
    // 1. PLACE TYPES (TRỤ CỘT / LOẠI ĐỊA ĐIỂM)
    // ==========================================

    public async Task<IReadOnlyList<AdminPlaceTypeListItemDto>> GetPlaceTypesAsync(bool? activeOnly = null, CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        var sql = @"
            SELECT 
                pt.Id,
                pt.Name,
                pt.Slug,
                pt.ImageUrl,
                pt.Status,
                (SELECT COUNT(1) FROM dbo.Categories c WHERE c.PlaceTypeId = pt.Id) AS TotalCategories,
                (SELECT COUNT(1) FROM dbo.Categories c WHERE c.PlaceTypeId = pt.Id AND c.Status = 1) AS ActiveCategories
            FROM dbo.PlaceTypes pt
            WHERE (@ActiveOnly IS NULL OR (@ActiveOnly = 1 AND pt.Status = 1))
            ORDER BY pt.Name;";

        var items = await connection.QueryAsync<AdminPlaceTypeListItemDto>(sql, new { ActiveOnly = activeOnly });
        return items.ToList();
    }

    public async Task<AdminPlaceTypeListItemDto?> GetPlaceTypeByIdAsync(int id, CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        const string sql = @"
            SELECT 
                pt.Id,
                pt.Name,
                pt.Slug,
                pt.ImageUrl,
                pt.Status,
                (SELECT COUNT(1) FROM dbo.Categories c WHERE c.PlaceTypeId = pt.Id) AS TotalCategories,
                (SELECT COUNT(1) FROM dbo.Categories c WHERE c.PlaceTypeId = pt.Id AND c.Status = 1) AS ActiveCategories
            FROM dbo.PlaceTypes pt
            WHERE pt.Id = @Id;";

        return await connection.QueryFirstOrDefaultAsync<AdminPlaceTypeListItemDto>(sql, new { Id = id });
    }

    public async Task<int> CreatePlaceTypeAsync(CreateAdminPlaceTypeRequest input, long adminId, CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        var name = input.Name.Trim();
        var slug = !string.IsNullOrWhiteSpace(input.Slug) ? input.Slug.Trim() : BlogRepository.GenerateSlug(name);

        const string checkSql = "SELECT COUNT(1) FROM dbo.PlaceTypes WHERE Name = @Name;";
        var exists = await connection.ExecuteScalarAsync<int>(checkSql, new { Name = name });
        if (exists > 0)
        {
            throw new InvalidOperationException($"Loại địa điểm '{name}' đã tồn tại trong hệ thống.");
        }

        const string insertSql = @"
            INSERT INTO dbo.PlaceTypes (Name, Slug, IconUrl, ImageUrl, DisplayOrder, Status)
            VALUES (@Name, @Slug, NULL, @ImageUrl, 0, @Status);
            SELECT CAST(SCOPE_IDENTITY() AS INT);";

        var newId = await connection.ExecuteScalarAsync<int>(insertSql, new
        {
            Name = name,
            Slug = slug,
            ImageUrl = input.ImageUrl?.Trim(),
            Status = input.Status
        });

        await _auditLogService.LogAsync(
            actionType: "CREATE_PLACE_TYPE",
            targetTable: "PlaceTypes",
            targetId: newId,
            reason: $"Tạo mới loại địa điểm lớn: {name}",
            newData: new
            {
                Name = name,
                Slug = slug,
                ImageUrl = input.ImageUrl?.Trim(),
                Status = input.Status
            },
            customAdminId: adminId,
            ct: ct);

        return newId;
    }

    public async Task<bool> UpdatePlaceTypeAsync(int id, UpdateAdminPlaceTypeRequest input, long adminId, CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        const string selectSql = "SELECT Id, Name, Slug, ImageUrl, Status FROM dbo.PlaceTypes WHERE Id = @Id;";
        var old = await connection.QueryFirstOrDefaultAsync(selectSql, new { Id = id });
        if (old == null) return false;

        var name = input.Name.Trim();
        var slug = !string.IsNullOrWhiteSpace(input.Slug) ? input.Slug.Trim() : BlogRepository.GenerateSlug(name);
        var imageUrl = !string.IsNullOrWhiteSpace(input.ImageUrl) ? input.ImageUrl.Trim() : (string?)old.ImageUrl;

        const string checkDupSql = "SELECT COUNT(1) FROM dbo.PlaceTypes WHERE Name = @Name AND Id <> @Id;";
        var dup = await connection.ExecuteScalarAsync<int>(checkDupSql, new { Name = name, Id = id });
        if (dup > 0)
        {
            throw new InvalidOperationException($"Tên loại địa điểm '{name}' bị trùng với bản ghi khác.");
        }

        const string updateSql = @"
            UPDATE dbo.PlaceTypes
            SET Name = @Name,
                Slug = @Slug,
                ImageUrl = @ImageUrl,
                Status = @Status
            WHERE Id = @Id;";

        var rows = await connection.ExecuteAsync(updateSql, new
        {
            Id = id,
            Name = name,
            Slug = slug,
            ImageUrl = imageUrl,
            Status = input.Status
        });

        if (rows > 0)
        {
            await _auditLogService.LogAsync(
                actionType: "UPDATE_PLACE_TYPE",
                targetTable: "PlaceTypes",
                targetId: id,
                reason: $"Cập nhật loại địa điểm: {name}",
                oldData: old,
                newData: new
                {
                    Name = name,
                    Slug = slug,
                    ImageUrl = imageUrl,
                    Status = input.Status
                },
                customAdminId: adminId,
                ct: ct);

            return true;
        }

        return false;
    }

    public async Task<bool> UpdatePlaceTypeStatusAsync(int id, byte status, string? reason, long adminId, CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        const string selectSql = "SELECT Id, Name, Status FROM dbo.PlaceTypes WHERE Id = @Id;";
        var old = await connection.QueryFirstOrDefaultAsync(selectSql, new { Id = id });
        if (old == null) return false;

        const string updateSql = @"
            UPDATE dbo.PlaceTypes SET Status = @Status WHERE Id = @Id;
            UPDATE dbo.Categories SET Status = @Status WHERE PlaceTypeId = @Id;";
        var rows = await connection.ExecuteAsync(updateSql, new { Id = id, Status = status });

        if (rows > 0)
        {
            var actionText = status == 1 ? "Kích hoạt loại địa điểm" : "Tạm ẩn loại địa điểm";
            await _auditLogService.LogAsync(
                actionType: "CHANGE_PLACE_TYPE_STATUS",
                targetTable: "PlaceTypes",
                targetId: id,
                reason: reason ?? $"{actionText}: {old.Name}",
                oldData: new { Status = old.Status },
                newData: new { Status = status },
                customAdminId: adminId,
                ct: ct);

            return true;
        }

        return false;
    }

    // ==========================================
    // 2. CATEGORIES (DANH MỤC CHI TIẾT)
    // ==========================================

    public async Task<PagedResult<AdminCategoryTaxonomyListItemDto>> GetCategoriesAsync(
        int? placeTypeId,
        byte? status,
        string? keyword,
        int page,
        int pageSize,
        CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        var whereClauses = new List<string> { "1=1" };
        var parameters = new DynamicParameters();

        if (placeTypeId.HasValue && placeTypeId.Value > 0)
        {
            whereClauses.Add("c.PlaceTypeId = @PlaceTypeId");
            parameters.Add("PlaceTypeId", placeTypeId.Value);
        }

        if (status.HasValue)
        {
            whereClauses.Add("c.Status = @Status");
            parameters.Add("Status", status.Value);
        }

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            whereClauses.Add("(c.Name LIKE @Keyword)");
            parameters.Add("Keyword", $"%{keyword.Trim()}%");
        }

        var whereSql = "WHERE " + string.Join(" AND ", whereClauses);

        var countSql = $"SELECT COUNT(1) FROM dbo.Categories c {whereSql};";
        var totalCount = await connection.ExecuteScalarAsync<int>(countSql, parameters);

        var offset = (page - 1) * pageSize;
        parameters.Add("Offset", offset);
        parameters.Add("PageSize", pageSize);

        var dataSql = $@"
            SELECT 
                c.Id,
                c.PlaceTypeId,
                pt.Name AS PlaceTypeName,
                c.Name,
                c.Slug,
                c.ImageUrl,
                c.Status,
                (SELECT COUNT(1) FROM dbo.Places pl WHERE pl.CategoryId = c.Id AND pl.Status = 1) AS PlaceCount,
                (SELECT COUNT(1) FROM dbo.Blogs b WHERE b.CategoryId = c.Id AND b.Status = 1) AS BlogCount,
                (SELECT COUNT(1) FROM dbo.Proposals prop WHERE prop.CategoryId = c.Id) AS ProposalCount,
                (SELECT COUNT(1) FROM dbo.AdminCategoryScopes acs WHERE acs.CategoryId = c.Id) AS AssignedAdminsCount
            FROM dbo.Categories c
            LEFT JOIN dbo.PlaceTypes pt ON c.PlaceTypeId = pt.Id
            {whereSql}
            ORDER BY c.PlaceTypeId, c.Name
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;";

        var items = (await connection.QueryAsync<AdminCategoryTaxonomyListItemDto>(dataSql, parameters)).ToList();

        return new PagedResult<AdminCategoryTaxonomyListItemDto>(items, totalCount, page, pageSize);
    }

    public async Task<AdminCategoryTaxonomyListItemDto?> GetCategoryByIdAsync(int id, CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        const string sql = @"
            SELECT 
                c.Id,
                c.PlaceTypeId,
                pt.Name AS PlaceTypeName,
                c.Name,
                c.Slug,
                c.ImageUrl,
                c.Status,
                (SELECT COUNT(1) FROM dbo.Places pl WHERE pl.CategoryId = c.Id AND pl.Status = 1) AS PlaceCount,
                (SELECT COUNT(1) FROM dbo.Blogs b WHERE b.CategoryId = c.Id AND b.Status = 1) AS BlogCount,
                (SELECT COUNT(1) FROM dbo.Proposals prop WHERE prop.CategoryId = c.Id) AS ProposalCount,
                (SELECT COUNT(1) FROM dbo.AdminCategoryScopes acs WHERE acs.CategoryId = c.Id) AS AssignedAdminsCount
            FROM dbo.Categories c
            LEFT JOIN dbo.PlaceTypes pt ON c.PlaceTypeId = pt.Id
            WHERE c.Id = @Id;";

        return await connection.QueryFirstOrDefaultAsync<AdminCategoryTaxonomyListItemDto>(sql, new { Id = id });
    }

    public async Task<int> CreateCategoryAsync(CreateAdminCategoryRequest input, long adminId, CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        // 1. Kiểm tra PlaceTypeId có tồn tại không
        const string checkPtSql = "SELECT COUNT(1) FROM dbo.PlaceTypes WHERE Id = @PlaceTypeId;";
        var ptExists = await connection.ExecuteScalarAsync<int>(checkPtSql, new { PlaceTypeId = input.PlaceTypeId });
        if (ptExists == 0)
        {
            throw new InvalidOperationException($"Loại địa điểm trực thuộc (PlaceTypeId = {input.PlaceTypeId}) không tồn tại.");
        }

        var name = input.Name.Trim();
        var slug = !string.IsNullOrWhiteSpace(input.Slug) ? input.Slug.Trim() : BlogRepository.GenerateSlug(name);

        const string checkDupSql = "SELECT COUNT(1) FROM dbo.Categories WHERE Name = @Name AND PlaceTypeId = @PlaceTypeId;";
        var dup = await connection.ExecuteScalarAsync<int>(checkDupSql, new { Name = name, PlaceTypeId = input.PlaceTypeId });
        if (dup > 0)
        {
            throw new InvalidOperationException($"Danh mục '{name}' đã tồn tại trong loại địa điểm này.");
        }

        const string insertSql = @"
            INSERT INTO dbo.Categories (PlaceTypeId, Name, Slug, IconUrl, ImageUrl, DisplayOrder, Status)
            VALUES (@PlaceTypeId, @Name, @Slug, NULL, @ImageUrl, 0, @Status);
            SELECT CAST(SCOPE_IDENTITY() AS INT);";

        var newId = await connection.ExecuteScalarAsync<int>(insertSql, new
        {
            PlaceTypeId = input.PlaceTypeId,
            Name = name,
            Slug = slug,
            ImageUrl = input.ImageUrl?.Trim(),
            Status = input.Status
        });

        await _auditLogService.LogAsync(
            actionType: "CREATE_CATEGORY",
            targetTable: "Categories",
            targetId: newId,
            reason: $"Tạo mới danh mục địa điểm: {name}",
            newData: new
            {
                PlaceTypeId = input.PlaceTypeId,
                Name = name,
                Slug = slug,
                ImageUrl = input.ImageUrl?.Trim(),
                Status = input.Status
            },
            customAdminId: adminId,
            ct: ct);

        return newId;
    }

    public async Task<bool> UpdateCategoryAsync(int id, UpdateAdminCategoryRequest input, long adminId, CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        const string selectSql = "SELECT Id, PlaceTypeId, Name, Slug, ImageUrl, Status FROM dbo.Categories WHERE Id = @Id;";
        var old = await connection.QueryFirstOrDefaultAsync(selectSql, new { Id = id });
        if (old == null) return false;

        const string checkPtSql = "SELECT COUNT(1) FROM dbo.PlaceTypes WHERE Id = @PlaceTypeId;";
        var ptExists = await connection.ExecuteScalarAsync<int>(checkPtSql, new { PlaceTypeId = input.PlaceTypeId });
        if (ptExists == 0)
        {
            throw new InvalidOperationException($"Loại địa điểm trực thuộc (PlaceTypeId = {input.PlaceTypeId}) không tồn tại.");
        }

        var name = input.Name.Trim();
        var slug = !string.IsNullOrWhiteSpace(input.Slug) ? input.Slug.Trim() : BlogRepository.GenerateSlug(name);
        var imageUrl = !string.IsNullOrWhiteSpace(input.ImageUrl) ? input.ImageUrl.Trim() : (string?)old.ImageUrl;

        const string checkDupSql = "SELECT COUNT(1) FROM dbo.Categories WHERE Name = @Name AND PlaceTypeId = @PlaceTypeId AND Id <> @Id;";
        var dup = await connection.ExecuteScalarAsync<int>(checkDupSql, new { Name = name, PlaceTypeId = input.PlaceTypeId, Id = id });
        if (dup > 0)
        {
            throw new InvalidOperationException($"Tên danh mục '{name}' bị trùng trong cùng nhóm loại địa điểm.");
        }

        const string updateSql = @"
            UPDATE dbo.Categories
            SET PlaceTypeId = @PlaceTypeId,
                Name = @Name,
                Slug = @Slug,
                ImageUrl = @ImageUrl,
                Status = @Status
            WHERE Id = @Id;";

        var rows = await connection.ExecuteAsync(updateSql, new
        {
            Id = id,
            PlaceTypeId = input.PlaceTypeId,
            Name = name,
            Slug = slug,
            ImageUrl = imageUrl,
            Status = input.Status
        });

        if (rows > 0)
        {
            await _auditLogService.LogAsync(
                actionType: "UPDATE_CATEGORY",
                targetTable: "Categories",
                targetId: id,
                reason: $"Cập nhật danh mục: {name}",
                oldData: old,
                newData: new
                {
                    PlaceTypeId = input.PlaceTypeId,
                    Name = name,
                    Slug = slug,
                    ImageUrl = imageUrl,
                    Status = input.Status
                },
                customAdminId: adminId,
                ct: ct);

            return true;
        }

        return false;
    }

    public async Task<bool> UpdateCategoryStatusAsync(int id, byte status, string? reason, long adminId, CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        const string selectSql = "SELECT Id, Name, Status FROM dbo.Categories WHERE Id = @Id;";
        var old = await connection.QueryFirstOrDefaultAsync(selectSql, new { Id = id });
        if (old == null) return false;

        const string updateSql = "UPDATE dbo.Categories SET Status = @Status WHERE Id = @Id;";
        var rows = await connection.ExecuteAsync(updateSql, new { Id = id, Status = status });

        if (rows > 0)
        {
            var actionText = status == 1 ? "Kích hoạt hiển thị danh mục" : "Tạm ẩn danh mục";
            await _auditLogService.LogAsync(
                actionType: "CHANGE_CATEGORY_STATUS",
                targetTable: "Categories",
                targetId: id,
                reason: reason ?? $"{actionText}: {old.Name}",
                oldData: new { Status = old.Status },
                newData: new { Status = status },
                customAdminId: adminId,
                ct: ct);

            return true;
        }

        return false;
    }
}
