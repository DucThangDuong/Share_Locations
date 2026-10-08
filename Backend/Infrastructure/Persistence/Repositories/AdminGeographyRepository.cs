using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs.Admin;
using Dapper;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class AdminGeographyRepository : IAdminGeographyRepository
{
    private readonly TravelReviewDbContext _dbContext;
    private readonly IAuditLogService _auditLogService;

    public AdminGeographyRepository(
        TravelReviewDbContext dbContext,
        IAuditLogService auditLogService)
    {
        _dbContext = dbContext;
        _auditLogService = auditLogService;
    }

    // ==========================================
    // 1. REGIONS (VÙNG / MIỀN)
    // ==========================================

    public async Task<IReadOnlyList<AdminRegionListItemDto>> GetRegionsAsync(bool? activeOnly = null, CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        var sql = @"
            SELECT 
                r.Id,
                r.Name,
                r.Slug,
                r.Tagline,
                r.Description,
                r.ImageUrl,
                r.OrderIndex,
                r.Status,
                (SELECT COUNT(1) FROM dbo.Provinces p WHERE p.RegionId = r.Id) AS TotalProvinces,
                (SELECT COUNT(1) FROM dbo.Provinces p WHERE p.RegionId = r.Id AND p.Status = 1) AS ActiveProvinces
            FROM dbo.Regions r
            WHERE (@ActiveOnly IS NULL OR (@ActiveOnly = 1 AND r.Status = 1))
            ORDER BY r.OrderIndex, r.Name;";

        var items = await connection.QueryAsync<AdminRegionListItemDto>(sql, new { ActiveOnly = activeOnly });
        return items.ToList();
    }

    public async Task<AdminRegionListItemDto?> GetRegionByIdAsync(int id, CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        const string sql = @"
            SELECT 
                r.Id,
                r.Name,
                r.Slug,
                r.Tagline,
                r.Description,
                r.ImageUrl,
                r.OrderIndex,
                r.Status,
                (SELECT COUNT(1) FROM dbo.Provinces p WHERE p.RegionId = r.Id) AS TotalProvinces,
                (SELECT COUNT(1) FROM dbo.Provinces p WHERE p.RegionId = r.Id AND p.Status = 1) AS ActiveProvinces
            FROM dbo.Regions r
            WHERE r.Id = @Id;";

        return await connection.QueryFirstOrDefaultAsync<AdminRegionListItemDto>(sql, new { Id = id });
    }

    public async Task<int> CreateRegionAsync(CreateAdminRegionRequest input, long adminId, CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        var name = input.Name.Trim();
        var slug = !string.IsNullOrWhiteSpace(input.Slug) ? input.Slug.Trim() : BlogRepository.GenerateSlug(name);

        const string checkSql = "SELECT COUNT(1) FROM dbo.Regions WHERE Name = @Name;";
        var exists = await connection.ExecuteScalarAsync<int>(checkSql, new { Name = name });
        if (exists > 0)
        {
            throw new InvalidOperationException($"Vùng/miền có tên '{name}' đã tồn tại trong hệ thống.");
        }

        const string insertSql = @"
            INSERT INTO dbo.Regions (Name, Slug, Tagline, Description, ImageUrl, OrderIndex, Status)
            VALUES (@Name, @Slug, @Tagline, @Description, @ImageUrl, @OrderIndex, @Status);
            SELECT CAST(SCOPE_IDENTITY() AS INT);";

        var newId = await connection.ExecuteScalarAsync<int>(insertSql, new
        {
            Name = name,
            Slug = slug,
            Tagline = input.Tagline?.Trim(),
            Description = input.Description?.Trim(),
            ImageUrl = input.ImageUrl?.Trim(),
            OrderIndex = input.OrderIndex,
            Status = input.Status
        });

        await _auditLogService.LogAsync(
            actionType: "CREATE_REGION",
            targetTable: "Regions",
            targetId: newId,
            reason: $"Thêm mới vùng/miền: {name}",
            newData: new
            {
                Name = name,
                Slug = slug,
                Tagline = input.Tagline,
                OrderIndex = input.OrderIndex,
                Status = input.Status
            },
            customAdminId: adminId,
            ct: ct);

        return newId;
    }

    public async Task<bool> UpdateRegionAsync(int id, UpdateAdminRegionRequest input, long adminId, CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        const string selectSql = "SELECT Id, Name, Slug, Tagline, Description, ImageUrl, OrderIndex, Status FROM dbo.Regions WHERE Id = @Id;";
        var old = await connection.QueryFirstOrDefaultAsync(selectSql, new { Id = id });
        if (old == null) return false;

        var name = input.Name.Trim();
        var slug = !string.IsNullOrWhiteSpace(input.Slug) ? input.Slug.Trim() : BlogRepository.GenerateSlug(name);

        const string checkDupSql = "SELECT COUNT(1) FROM dbo.Regions WHERE Name = @Name AND Id <> @Id;";
        var dup = await connection.ExecuteScalarAsync<int>(checkDupSql, new { Name = name, Id = id });
        if (dup > 0)
        {
            throw new InvalidOperationException($"Tên vùng/miền '{name}' bị trùng với một vùng khác.");
        }

        const string updateSql = @"
            UPDATE dbo.Regions
            SET Name = @Name,
                Slug = @Slug,
                Tagline = @Tagline,
                Description = @Description,
                ImageUrl = @ImageUrl,
                OrderIndex = @OrderIndex,
                Status = @Status
            WHERE Id = @Id;";

        var rows = await connection.ExecuteAsync(updateSql, new
        {
            Id = id,
            Name = name,
            Slug = slug,
            Tagline = input.Tagline?.Trim(),
            Description = input.Description?.Trim(),
            ImageUrl = input.ImageUrl?.Trim(),
            OrderIndex = input.OrderIndex,
            Status = input.Status
        });

        if (rows > 0)
        {
            await _auditLogService.LogAsync(
                actionType: "UPDATE_REGION",
                targetTable: "Regions",
                targetId: id,
                reason: $"Cập nhật vùng/miền: {name}",
                oldData: old,
                newData: new
                {
                    Name = name,
                    Slug = slug,
                    Tagline = input.Tagline,
                    OrderIndex = input.OrderIndex,
                    Status = input.Status
                },
                customAdminId: adminId,
                ct: ct);

            return true;
        }

        return false;
    }

    public async Task<bool> UpdateRegionStatusAsync(int id, byte status, string? reason, long adminId, CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        const string selectSql = "SELECT Id, Name, Status FROM dbo.Regions WHERE Id = @Id;";
        var old = await connection.QueryFirstOrDefaultAsync(selectSql, new { Id = id });
        if (old == null) return false;

        const string updateSql = "UPDATE dbo.Regions SET Status = @Status WHERE Id = @Id;";
        var rows = await connection.ExecuteAsync(updateSql, new { Id = id, Status = status });

        if (rows > 0)
        {
            var actionText = status == 1 ? "Kích hoạt hiển thị vùng" : "Ẩn vùng khỏi hệ thống";
            await _auditLogService.LogAsync(
                actionType: "CHANGE_REGION_STATUS",
                targetTable: "Regions",
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

    public async Task<(bool Success, string? ErrorMessage)> DeleteRegionAsync(int id, long adminId, CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        const string selectSql = "SELECT Id, Name, Status FROM dbo.Regions WHERE Id = @Id;";
        var old = await connection.QueryFirstOrDefaultAsync(selectSql, new { Id = id });
        if (old == null) return (false, "Không tìm thấy vùng/miền cần xóa.");

        // Kiểm tra ràng buộc: Có tỉnh trực thuộc không?
        const string countProvSql = "SELECT COUNT(1) FROM dbo.Provinces WHERE RegionId = @Id;";
        var provCount = await connection.ExecuteScalarAsync<int>(countProvSql, new { Id = id });
        if (provCount > 0)
        {
            return (false, $"Không thể xóa vùng '{old.Name}' vì đang có {provCount} tỉnh/thành phố trực thuộc. Vui lòng chuyển vùng cho các tỉnh này hoặc chuyển trạng thái vùng sang Tạm ẩn.");
        }

        const string deleteSql = "DELETE FROM dbo.Regions WHERE Id = @Id;";
        await connection.ExecuteAsync(deleteSql, new { Id = id });

        await _auditLogService.LogAsync(
            actionType: "DELETE_REGION",
            targetTable: "Regions",
            targetId: id,
            reason: $"Xóa vùng/miền: {old.Name}",
            oldData: old,
            newData: null,
            customAdminId: adminId,
            ct: ct);

        return (true, null);
    }

    // ==========================================
    // 2. PROVINCES (TỈNH / THÀNH PHỐ)
    // ==========================================

    public async Task<PagedResult<AdminProvinceListItemDto>> GetProvincesAsync(
        int? regionId,
        byte? status,
        bool? featured,
        string? keyword,
        int page,
        int pageSize,
        CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        var whereClauses = new List<string> { "1=1" };
        var parameters = new DynamicParameters();

        if (regionId.HasValue && regionId.Value > 0)
        {
            whereClauses.Add("p.RegionId = @RegionId");
            parameters.Add("RegionId", regionId.Value);
        }

        if (status.HasValue)
        {
            whereClauses.Add("p.Status = @Status");
            parameters.Add("Status", status.Value);
        }

        if (featured.HasValue)
        {
            whereClauses.Add("p.Featured = @Featured");
            parameters.Add("Featured", featured.Value);
        }

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            whereClauses.Add("(p.Name LIKE @Keyword OR p.Tagline LIKE @Keyword)");
            parameters.Add("Keyword", $"%{keyword.Trim()}%");
        }

        var whereSql = "WHERE " + string.Join(" AND ", whereClauses);

        var countSql = $"SELECT COUNT(1) FROM dbo.Provinces p {whereSql};";
        var totalCount = await connection.ExecuteScalarAsync<int>(countSql, parameters);

        var offset = (page - 1) * pageSize;
        parameters.Add("Offset", offset);
        parameters.Add("PageSize", pageSize);

        var dataSql = $@"
            SELECT 
                p.Id,
                p.RegionId,
                r.Name AS RegionName,
                p.Name,
                p.Slug,
                p.Tagline,
                p.Description,
                p.ImageUrl,
                p.Featured,
                p.DisplayOrder,
                p.Status,
                (SELECT COUNT(1) FROM dbo.Places pl WHERE pl.ProvinceId = p.Id AND pl.Status = 1) AS PlaceCount,
                (SELECT COUNT(1) FROM dbo.FoodProvinces fp WHERE fp.ProvinceId = p.Id) AS FoodCount
            FROM dbo.Provinces p
            LEFT JOIN dbo.Regions r ON p.RegionId = r.Id
            {whereSql}
            ORDER BY p.DisplayOrder, p.Name
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;";

        var items = (await connection.QueryAsync<AdminProvinceListItemDto>(dataSql, parameters)).ToList();

        return new PagedResult<AdminProvinceListItemDto>(items, totalCount, page, pageSize);
    }

    public async Task<AdminProvinceDetailDto?> GetProvinceByIdAsync(int id, CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        const string sql = @"
            SELECT 
                p.Id,
                p.RegionId,
                r.Name AS RegionName,
                p.Name,
                p.Slug,
                p.Tagline,
                p.Description,
                p.ImageUrl,
                p.Featured,
                p.DisplayOrder,
                p.Status,
                (SELECT COUNT(1) FROM dbo.Places pl WHERE pl.ProvinceId = p.Id AND pl.Status = 1) AS PlaceCount,
                (SELECT COUNT(1) FROM dbo.FoodProvinces fp WHERE fp.ProvinceId = p.Id) AS FoodCount,
                (SELECT COUNT(1) FROM dbo.Proposals prop WHERE prop.ProvinceId = p.Id) AS ProposalCount,
                (SELECT COUNT(1) FROM dbo.AdminProvinceScopes aps WHERE aps.ProvinceId = p.Id) AS AssignedAdminsCount
            FROM dbo.Provinces p
            LEFT JOIN dbo.Regions r ON p.RegionId = r.Id
            WHERE p.Id = @Id;";

        return await connection.QueryFirstOrDefaultAsync<AdminProvinceDetailDto>(sql, new { Id = id });
    }

    public async Task<int> CreateProvinceAsync(CreateAdminProvinceRequest input, long adminId, CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        // 1. Kiểm tra RegionId có hợp lệ không
        const string checkRegSql = "SELECT COUNT(1) FROM dbo.Regions WHERE Id = @RegionId;";
        var regExists = await connection.ExecuteScalarAsync<int>(checkRegSql, new { RegionId = input.RegionId });
        if (regExists == 0)
        {
            throw new InvalidOperationException($"Vùng/miền trực thuộc (RegionId = {input.RegionId}) không tồn tại.");
        }

        var name = input.Name.Trim();
        var slug = !string.IsNullOrWhiteSpace(input.Slug) ? input.Slug.Trim() : BlogRepository.GenerateSlug(name);

        const string checkDupSql = "SELECT COUNT(1) FROM dbo.Provinces WHERE Name = @Name AND RegionId = @RegionId;";
        var dup = await connection.ExecuteScalarAsync<int>(checkDupSql, new { Name = name, RegionId = input.RegionId });
        if (dup > 0)
        {
            throw new InvalidOperationException($"Tỉnh/thành phố '{name}' đã tồn tại trong vùng này.");
        }

        const string insertSql = @"
            INSERT INTO dbo.Provinces (RegionId, Name, Slug, Tagline, Description, ImageUrl, Featured, DisplayOrder, Status)
            VALUES (@RegionId, @Name, @Slug, @Tagline, @Description, @ImageUrl, @Featured, @DisplayOrder, @Status);
            SELECT CAST(SCOPE_IDENTITY() AS INT);";

        var newId = await connection.ExecuteScalarAsync<int>(insertSql, new
        {
            RegionId = input.RegionId,
            Name = name,
            Slug = slug,
            Tagline = input.Tagline?.Trim(),
            Description = input.Description?.Trim(),
            ImageUrl = input.ImageUrl?.Trim(),
            Featured = input.Featured,
            DisplayOrder = input.DisplayOrder,
            Status = input.Status
        });

        await _auditLogService.LogAsync(
            actionType: "CREATE_PROVINCE",
            targetTable: "Provinces",
            targetId: newId,
            reason: $"Thêm mới tỉnh/thành: {name}",
            newData: new
            {
                RegionId = input.RegionId,
                Name = name,
                Slug = slug,
                Tagline = input.Tagline,
                Featured = input.Featured,
                DisplayOrder = input.DisplayOrder,
                Status = input.Status
            },
            customAdminId: adminId,
            ct: ct);

        return newId;
    }

    public async Task<bool> UpdateProvinceAsync(int id, UpdateAdminProvinceRequest input, long adminId, CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        const string selectSql = "SELECT Id, RegionId, Name, Slug, Tagline, Description, ImageUrl, Featured, DisplayOrder, Status FROM dbo.Provinces WHERE Id = @Id;";
        var old = await connection.QueryFirstOrDefaultAsync(selectSql, new { Id = id });
        if (old == null) return false;

        // Kiểm tra RegionId
        const string checkRegSql = "SELECT COUNT(1) FROM dbo.Regions WHERE Id = @RegionId;";
        var regExists = await connection.ExecuteScalarAsync<int>(checkRegSql, new { RegionId = input.RegionId });
        if (regExists == 0)
        {
            throw new InvalidOperationException($"Vùng/miền trực thuộc (RegionId = {input.RegionId}) không tồn tại.");
        }

        var name = input.Name.Trim();
        var slug = !string.IsNullOrWhiteSpace(input.Slug) ? input.Slug.Trim() : BlogRepository.GenerateSlug(name);

        const string checkDupSql = "SELECT COUNT(1) FROM dbo.Provinces WHERE Name = @Name AND RegionId = @RegionId AND Id <> @Id;";
        var dup = await connection.ExecuteScalarAsync<int>(checkDupSql, new { Name = name, RegionId = input.RegionId, Id = id });
        if (dup > 0)
        {
            throw new InvalidOperationException($"Tên tỉnh/thành '{name}' bị trùng với bản ghi khác trong cùng vùng.");
        }

        const string updateSql = @"
            UPDATE dbo.Provinces
            SET RegionId = @RegionId,
                Name = @Name,
                Slug = @Slug,
                Tagline = @Tagline,
                Description = @Description,
                ImageUrl = @ImageUrl,
                Featured = @Featured,
                DisplayOrder = @DisplayOrder,
                Status = @Status
            WHERE Id = @Id;";

        var rows = await connection.ExecuteAsync(updateSql, new
        {
            Id = id,
            RegionId = input.RegionId,
            Name = name,
            Slug = slug,
            Tagline = input.Tagline?.Trim(),
            Description = input.Description?.Trim(),
            ImageUrl = input.ImageUrl?.Trim(),
            Featured = input.Featured,
            DisplayOrder = input.DisplayOrder,
            Status = input.Status
        });

        if (rows > 0)
        {
            await _auditLogService.LogAsync(
                actionType: "UPDATE_PROVINCE",
                targetTable: "Provinces",
                targetId: id,
                reason: $"Cập nhật tỉnh/thành: {name}",
                oldData: old,
                newData: new
                {
                    RegionId = input.RegionId,
                    Name = name,
                    Slug = slug,
                    Tagline = input.Tagline,
                    Featured = input.Featured,
                    DisplayOrder = input.DisplayOrder,
                    Status = input.Status
                },
                customAdminId: adminId,
                ct: ct);

            return true;
        }

        return false;
    }

    public async Task<bool> UpdateProvinceStatusAsync(int id, byte status, string? reason, long adminId, CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        const string selectSql = "SELECT Id, Name, Status FROM dbo.Provinces WHERE Id = @Id;";
        var old = await connection.QueryFirstOrDefaultAsync(selectSql, new { Id = id });
        if (old == null) return false;

        const string updateSql = "UPDATE dbo.Provinces SET Status = @Status WHERE Id = @Id;";
        var rows = await connection.ExecuteAsync(updateSql, new { Id = id, Status = status });

        if (rows > 0)
        {
            var actionText = status == 1 ? "Kích hoạt hiển thị tỉnh/thành" : "Ẩn tỉnh/thành khỏi hệ thống";
            await _auditLogService.LogAsync(
                actionType: "CHANGE_PROVINCE_STATUS",
                targetTable: "Provinces",
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

    public async Task<(bool Success, string? ErrorMessage)> DeleteProvinceAsync(int id, long adminId, CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        const string selectSql = "SELECT Id, Name, Status FROM dbo.Provinces WHERE Id = @Id;";
        var old = await connection.QueryFirstOrDefaultAsync(selectSql, new { Id = id });
        if (old == null) return (false, "Không tìm thấy tỉnh/thành phố cần xóa.");

        // Kiểm tra an toàn: Có địa điểm hoặc món ăn gắn với tỉnh không?
        const string checkPlacesSql = "SELECT COUNT(1) FROM dbo.Places WHERE ProvinceId = @Id;";
        var placeCount = await connection.ExecuteScalarAsync<int>(checkPlacesSql, new { Id = id });

        const string checkFoodsSql = "SELECT COUNT(1) FROM dbo.FoodProvinces WHERE ProvinceId = @Id;";
        var foodCount = await connection.ExecuteScalarAsync<int>(checkFoodsSql, new { Id = id });

        if (placeCount > 0 || foodCount > 0)
        {
            return (false, $"Không thể xóa tỉnh '{old.Name}' vì đang có {placeCount} địa điểm và {foodCount} món ăn liên kết. Vui lòng chuyển trạng thái tỉnh sang Tạm ẩn (Inactive) để bảo toàn dữ liệu.");
        }

        // Xóa các scope phụ trách cũ nếu có
        await connection.ExecuteAsync("DELETE FROM dbo.AdminProvinceScopes WHERE ProvinceId = @Id;", new { Id = id });
        await connection.ExecuteAsync("DELETE FROM dbo.Provinces WHERE Id = @Id;", new { Id = id });

        await _auditLogService.LogAsync(
            actionType: "DELETE_PROVINCE",
            targetTable: "Provinces",
            targetId: id,
            reason: $"Xóa tỉnh/thành phố: {old.Name}",
            oldData: old,
            newData: null,
            customAdminId: adminId,
            ct: ct);

        return (true, null);
    }
}
