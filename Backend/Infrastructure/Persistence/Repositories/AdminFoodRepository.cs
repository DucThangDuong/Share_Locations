using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs.Admin;
using Dapper;
using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class AdminFoodRepository : IAdminFoodRepository
{
    private readonly TravelReviewDbContext _dbContext;
    private readonly ICurrentUserService _currentUserService;
    private readonly IBlobService? _blobService;
    private readonly IAuditLogService _auditLogService;

    private sealed class RawAdminFoodPlaceRow
    {
        public long FoodId { get; set; }
        public long Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? CoverImageUrl { get; set; }
    }

    public AdminFoodRepository(
        TravelReviewDbContext dbContext,
        ICurrentUserService currentUserService,
        IAuditLogService auditLogService,
        IBlobService? blobService = null)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
        _auditLogService = auditLogService;
        _blobService = blobService;
    }

    public async Task<PagedResult<AdminFoodItemDto>> GetAdminFoodsAsync(
        int? provinceId,
        string? status,
        string? keyword,
        int page,
        int pageSize,
        string? sortBy = null,
        string? sortOrder = null,
        string? province = null,
        CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        var whereClauses = new List<string>();
        var parameters = new DynamicParameters();

        AdminScopeFilterHelper.ApplyFoodScope(_currentUserService, whereClauses, parameters, "f");

        if (provinceId.HasValue && provinceId.Value > 0)
        {
            whereClauses.Add("EXISTS (SELECT 1 FROM dbo.FoodProvinces fp WHERE fp.FoodId = f.Id AND fp.ProvinceId = @ProvinceId)");
            parameters.Add("ProvinceId", provinceId.Value);
        }
        else if (!string.IsNullOrWhiteSpace(province) && !province.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            var cleanName = province.Replace("Thành phố", "", StringComparison.OrdinalIgnoreCase)
                                    .Replace("Tỉnh", "", StringComparison.OrdinalIgnoreCase)
                                    .Replace("TP.", "", StringComparison.OrdinalIgnoreCase)
                                    .Replace("TP", "", StringComparison.OrdinalIgnoreCase)
                                    .Trim();

            whereClauses.Add(@"EXISTS (
                SELECT 1 FROM dbo.FoodProvinces fp
                INNER JOIN dbo.Provinces prov ON fp.ProvinceId = prov.Id
                WHERE fp.FoodId = f.Id AND (prov.Name = @ProvinceName OR prov.Name LIKE @ProvinceLike)
            )");
            parameters.Add("ProvinceName", province.Trim());
            parameters.Add("ProvinceLike", $"%{cleanName}%");
        }

        if (!string.IsNullOrWhiteSpace(status) && status.ToLowerInvariant() != "all")
        {
            var isHidden = status.Equals("hidden", StringComparison.OrdinalIgnoreCase);
            whereClauses.Add(isHidden ? "f.Status = 0" : "f.Status = 1");
        }

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            whereClauses.Add("(f.Name LIKE @Keyword OR f.Description LIKE @Keyword)");
            parameters.Add("Keyword", $"%{keyword.Trim()}%");
        }

        var whereSql = whereClauses.Count > 0 ? " WHERE " + string.Join(" AND ", whereClauses) : "";

        var countSql = $"SELECT COUNT(1) FROM dbo.Foods f {whereSql};";
        var totalCount = await connection.ExecuteScalarAsync<int>(countSql, parameters);

        var offset = (page - 1) * pageSize;
        parameters.Add("Offset", offset);
        parameters.Add("PageSize", pageSize);

        var sortColumn = (sortBy?.ToLower()) switch
        {
            "name" => "f.Name",
            "price" => "COALESCE(f.MinPrice, f.MaxPrice, 0)",
            "updatedat" => "COALESCE((SELECT TOP 1 al.CreatedAt FROM dbo.AdminActionLogs al WHERE al.TargetTable = 'Foods' AND al.TargetId = f.Id ORDER BY al.CreatedAt DESC), f.CreatedAt)",
            _ => "f.CreatedAt"
        };
        var sortDirection = string.Equals(sortOrder, "asc", StringComparison.OrdinalIgnoreCase) ? "ASC" : "DESC";
        var orderSql = $"ORDER BY {sortColumn} {sortDirection}, f.Id {sortDirection}";

        var dataSql = $@"
            SELECT
                f.Id,
                f.Name,
                (SELECT TOP 1 prov.Name FROM dbo.FoodProvinces fp INNER JOIN dbo.Provinces prov ON fp.ProvinceId = prov.Id WHERE fp.FoodId = f.Id) AS Province,
                (SELECT TOP 1 fp.ProvinceId FROM dbo.FoodProvinces fp WHERE fp.FoodId = f.Id) AS ProvinceId,
                f.MinPrice,
                f.MaxPrice,
                f.CoverImageUrl AS CoverImg,
                f.Description AS [Desc],
                f.HistoryInfo,
                CASE WHEN f.Status = 1 THEN 'active' ELSE 'hidden' END AS Status,
                (SELECT COUNT(1) FROM dbo.FoodPlaces fpl INNER JOIN dbo.Places p ON fpl.PlaceId = p.Id WHERE fpl.FoodId = f.Id) AS PlacesCount,
                f.CreatedAt,
                (SELECT TOP 1 al.CreatedAt FROM dbo.AdminActionLogs al WHERE al.TargetTable = 'Foods' AND al.TargetId = f.Id ORDER BY al.CreatedAt DESC) AS UpdatedAt,
                COALESCE(
                    (SELECT TOP 1 COALESCE(up.FullName, u.Email)
                     FROM dbo.AdminActionLogs al
                     JOIN dbo.Users u ON al.AdminId = u.Id
                     LEFT JOIN dbo.UserProfiles up ON u.Id = up.UserId
                     WHERE al.TargetTable = 'Foods' AND al.TargetId = f.Id
                     ORDER BY al.CreatedAt DESC),
                    N'Admin'
                ) AS UpdatedBy,
                (SELECT TOP 1 COALESCE(up.FullName, u.Email)
                 FROM dbo.AdminActionLogs al
                 JOIN dbo.Users u ON al.AdminId = u.Id
                 LEFT JOIN dbo.UserProfiles up ON u.Id = up.UserId
                 WHERE al.TargetTable = 'Foods' AND al.TargetId = f.Id AND al.ActionType = 'CREATE_FOOD'
                 ORDER BY al.CreatedAt ASC) AS CreatedBy
            FROM dbo.Foods f
            {whereSql}
            {orderSql}
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;";

        var items = (await connection.QueryAsync<AdminFoodItemDto>(dataSql, parameters)).ToList();

        if (items.Count > 0)
        {
            var foodIds = items.Select(x => x.Id).Distinct().ToList();
            const string placesSql = @"
                SELECT
                    fpl.FoodId,
                    p.Id,
                    p.Name,
                    COALESCE(
                        NULLIF(p.CoverImageUrl, ''),
                        (SELECT TOP 1 pm.Url FROM dbo.PlaceMedia pm WHERE pm.PlaceId = p.Id ORDER BY pm.DisplayOrder ASC, pm.Id ASC)
                    ) AS CoverImageUrl
                FROM dbo.FoodPlaces fpl
                INNER JOIN dbo.Places p ON fpl.PlaceId = p.Id
                WHERE fpl.FoodId IN @FoodIds
                ORDER BY p.Id DESC;";

            var placeRows = (await connection.QueryAsync<RawAdminFoodPlaceRow>(placesSql, new { FoodIds = foodIds })).ToList();
            var placesByFood = placeRows.ToLookup(r => r.FoodId);

            foreach (var item in items)
            {
                var foodPlaces = placesByFood[item.Id]
                    .Select(r => new AdminFoodPlaceDto
                    {
                        Id = r.Id,
                        Name = r.Name,
                        CoverImageUrl = r.CoverImageUrl
                    })
                    .ToList();

                item.Places = foodPlaces;
                item.PlacesCount = foodPlaces.Count;
            }
        }

        return new PagedResult<AdminFoodItemDto>(items, totalCount, page, pageSize);
    }

    public async Task<long> CreateAdminFoodAsync(CreateAdminFoodInput input, CancellationToken ct = default)
    {
        if (!AdminScopeFilterHelper.ValidateFoodInputScope(_currentUserService, input.ProvinceId))
        {
            throw new UnauthorizedAccessException("Bạn không có quyền tạo món ăn ngoài phạm vi quản lý.");
        }

        var status = input.Status.Equals("hidden", StringComparison.OrdinalIgnoreCase)
            ? RecordStatus.Inactive
            : RecordStatus.Active;

        var food = new Food(
            name: input.Name,
            description: input.Desc,
            historyInfo: input.HistoryInfo,
            coverImageUrl: input.CoverImg,
            minPrice: input.MinPrice,
            maxPrice: input.MaxPrice,
            status: status);

        _dbContext.Foods.Add(food);
        await _dbContext.SaveChangesAsync(ct);

        if (input.ProvinceId.HasValue && input.ProvinceId.Value > 0)
        {
            var foodProvince = new FoodProvince(food.Id, input.ProvinceId.Value);
            _dbContext.FoodProvinces.Add(foodProvince);
            await _dbContext.SaveChangesAsync(ct);
        }

        await _auditLogService.LogAsync(
            actionType: "CREATE_FOOD",
            targetTable: "Foods",
            targetId: food.Id,
            reason: $"Tạo mới món ăn: {food.Name}",
            newData: new
            {
                Name = food.Name,
                Description = food.Description,
                MinPrice = food.MinPrice,
                MaxPrice = food.MaxPrice,
                Status = (int)food.Status,
                ProvinceId = input.ProvinceId
            },
            ct: ct);

        return food.Id;
    }

    public async Task<bool> UpdateAdminFoodAsync(long id, UpdateAdminFoodInput input, CancellationToken ct = default)
    {
        if (!await IsFoodInScopeAsync(id)) return false;

        var food = await _dbContext.Foods.FirstOrDefaultAsync(f => f.Id == id, ct);
        if (food == null) return false;

        var oldProvinceId = await _dbContext.FoodProvinces
            .Where(fp => fp.FoodId == id)
            .Select(fp => (int?)fp.ProvinceId)
            .FirstOrDefaultAsync(ct);

        var oldData = new
        {
            Name = food.Name,
            Description = food.Description,
            MinPrice = food.MinPrice,
            MaxPrice = food.MaxPrice,
            Status = (int)food.Status,
            ProvinceId = oldProvinceId
        };

        var oldCoverUrl = food.CoverImageUrl;
        var effectiveCoverImg = !string.IsNullOrWhiteSpace(input.CoverImg) ? input.CoverImg : oldCoverUrl;

        food.UpdateDetails(input.Name, input.Desc, input.HistoryInfo, effectiveCoverImg);
        food.UpdatePrice(input.MinPrice, input.MaxPrice);

        input.CoverImg = effectiveCoverImg;

        var status = input.Status.Equals("hidden", StringComparison.OrdinalIgnoreCase)
            ? RecordStatus.Inactive
            : RecordStatus.Active;
        food.UpdateStatus(status);

        var effectiveProvinceId = oldProvinceId;
        if (input.ProvinceId.HasValue && input.ProvinceId.Value > 0)
        {
            if (!AdminScopeFilterHelper.ValidateFoodInputScope(_currentUserService, input.ProvinceId.Value))
            {
                return false;
            }

            var existing = await _dbContext.FoodProvinces.FirstOrDefaultAsync(fp => fp.FoodId == id, ct);
            if (existing == null)
            {
                _dbContext.FoodProvinces.Add(new FoodProvince(id, input.ProvinceId.Value));
            }
            else if (existing.ProvinceId != input.ProvinceId.Value)
            {
                _dbContext.FoodProvinces.Remove(existing);
                _dbContext.FoodProvinces.Add(new FoodProvince(id, input.ProvinceId.Value));
            }
            effectiveProvinceId = input.ProvinceId.Value;
        }

        await _dbContext.SaveChangesAsync(ct);

        await _auditLogService.LogAsync(
            actionType: "UPDATE_FOOD",
            targetTable: "Foods",
            targetId: id,
            reason: $"Cập nhật món ăn: {food.Name}",
            oldData: oldData,
            newData: new
            {
                Name = food.Name,
                Description = food.Description,
                MinPrice = food.MinPrice,
                MaxPrice = food.MaxPrice,
                Status = (int)food.Status,
                ProvinceId = effectiveProvinceId
            },
            ct: ct);

        if (_blobService != null &&
            !string.IsNullOrWhiteSpace(oldCoverUrl) &&
            !string.IsNullOrWhiteSpace(input.CoverImg) &&
            !string.Equals(oldCoverUrl, input.CoverImg, StringComparison.OrdinalIgnoreCase) &&
            oldCoverUrl.Contains(".blob.core.windows.net/"))
        {
            _ = Task.Run(async () =>
            {
                try
                {
                    await _blobService.DeleteImageAsync(oldCoverUrl, "foods", CancellationToken.None);
                }
                catch
                {
                }
            });
        }

        return true;
    }

    public async Task<bool> UpdateAdminFoodStatusAsync(long id, string status, CancellationToken ct = default)
    {
        if (!await IsFoodInScopeAsync(id)) return false;

        var food = await _dbContext.Foods.FirstOrDefaultAsync(f => f.Id == id, ct);
        if (food == null) return false;

        var recordStatus = status.Equals("hidden", StringComparison.OrdinalIgnoreCase)
            ? RecordStatus.Inactive
            : RecordStatus.Active;

        var oldStatus = food.Status;
        food.UpdateStatus(recordStatus);
        await _dbContext.SaveChangesAsync(ct);

        await _auditLogService.LogAsync(
            actionType: "UPDATE_FOOD_STATUS",
            targetTable: "Foods",
            targetId: id,
            reason: $"Thay đổi trạng thái món ăn #{id} sang {status}",
            oldData: new { Status = (int)oldStatus },
            newData: new { Status = (int)recordStatus },
            ct: ct);

        return true;
    }

    public async Task<bool> DeleteAdminFoodAsync(long id, CancellationToken ct = default)
    {
        if (!await IsFoodInScopeAsync(id)) return false;

        var food = await _dbContext.Foods.FirstOrDefaultAsync(f => f.Id == id, ct);
        if (food == null) return false;

        var oldData = new { Id = food.Id, Name = food.Name, Status = (int)food.Status };
        _dbContext.Foods.Remove(food);
        await _dbContext.SaveChangesAsync(ct);

        await _auditLogService.LogAsync(
            actionType: "DELETE_FOOD",
            targetTable: "Foods",
            targetId: id,
            reason: $"Xóa món ăn #{id} ({food.Name})",
            oldData: oldData,
            ct: ct);

        return true;
    }

    private async Task<bool> IsFoodInScopeAsync(long foodId)
    {
        if (_currentUserService.IsSystemAdmin) return true;
        var connection = _dbContext.Database.GetDbConnection();
        var clauses = new List<string> { "f.Id = @FoodId" };
        var p = new DynamicParameters();
        p.Add("FoodId", foodId);
        AdminScopeFilterHelper.ApplyFoodScope(_currentUserService, clauses, p, "f");
        var sql = $"SELECT COUNT(1) FROM dbo.Foods f WHERE {string.Join(" AND ", clauses)};";
        return await connection.ExecuteScalarAsync<int>(sql, p) > 0;
    }
}
