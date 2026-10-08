using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs.Admin;
using Dapper;
using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class AdminPlaceRepository : IAdminPlaceRepository
{
    private readonly TravelReviewDbContext _dbContext;
    private readonly ICurrentUserService _currentUserService;
    private readonly IAuditLogService _auditLogService;

    public AdminPlaceRepository(
        TravelReviewDbContext dbContext,
        ICurrentUserService currentUserService,
        IAuditLogService auditLogService)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
        _auditLogService = auditLogService;
    }

    public async Task<PagedResult<AdminPlaceListItemDto>> GetAdminPlacesAsync(
        int? provinceId,
        int? categoryId,
        int? status,
        string? keyword,
        int page,
        int pageSize,
        CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        var whereClauses = new List<string>();
        var parameters = new DynamicParameters();

        // Áp dụng giới hạn phân quyền theo Scope (Category, Province, Region) của Admin cấp 1
        AdminScopeFilterHelper.ApplyPlaceScope(_currentUserService, whereClauses, parameters, "p", "prov");

        if (provinceId.HasValue && provinceId.Value > 0)
        {
            whereClauses.Add("p.ProvinceId = @ProvinceId");
            parameters.Add("ProvinceId", provinceId.Value);
        }

        if (categoryId.HasValue && categoryId.Value > 0)
        {
            whereClauses.Add("p.CategoryId = @CategoryId");
            parameters.Add("CategoryId", categoryId.Value);
        }

        if (status.HasValue)
        {
            whereClauses.Add("p.Status = @Status");
            parameters.Add("Status", status.Value);
        }

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            whereClauses.Add("(p.Name LIKE @Keyword OR p.Address LIKE @Keyword)");
            parameters.Add("Keyword", $"%{keyword.Trim()}%");
        }

        var whereSql = whereClauses.Count > 0 ? " WHERE " + string.Join(" AND ", whereClauses) : "";

        var countSql = $@"
            SELECT COUNT(1) 
            FROM dbo.Places p 
            LEFT JOIN dbo.Provinces prov ON p.ProvinceId = prov.Id 
            {whereSql};";
        var totalCount = await connection.ExecuteScalarAsync<int>(countSql, parameters);

        var offset = (page - 1) * pageSize;
        parameters.Add("Offset", offset);
        parameters.Add("PageSize", pageSize);

        var dataSql = $@"
            SELECT 
                p.Id,
                p.Name,
                cat.Name AS Category,
                p.CategoryId,
                prov.Name AS Province,
                p.ProvinceId,
                p.Address AS Location,
                p.Latitude,
                p.Longitude,
                p.MinPrice,
                p.MaxPrice,
                p.OpeningHours AS Hours,
                p.Phone,
                p.Website,
                CAST(p.Status AS INT) AS StatusNum,
                p.AvgRating AS Rating,
                p.ReviewCount AS ReviewsCount,
                p.CoverImageUrl AS Img
            FROM dbo.Places p
            LEFT JOIN dbo.Categories cat ON p.CategoryId = cat.Id
            LEFT JOIN dbo.Provinces prov ON p.ProvinceId = prov.Id
            {whereSql}
            ORDER BY p.UpdatedAt DESC
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;";

        var items = (await connection.QueryAsync<AdminPlaceListItemDto>(dataSql, parameters)).ToList();
        return new PagedResult<AdminPlaceListItemDto>(items, totalCount, page, pageSize);
    }

    public async Task<AdminPlaceDetailDto?> GetAdminPlaceDetailAsync(long id, CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        const string sql = @"
            SELECT 
                p.Id,
                p.Name,
                cat.Name AS Category,
                p.CategoryId,
                prov.Name AS Province,
                p.ProvinceId,
                p.Address AS Location,
                p.Latitude,
                p.Longitude,
                p.MinPrice,
                p.MaxPrice,
                p.OpeningHours AS Hours,
                p.Phone,
                p.Website,
                CAST(p.Status AS INT) AS StatusNum,
                p.AvgRating AS Rating,
                p.ReviewCount AS ReviewsCount,
                p.CoverImageUrl AS Img,
                p.Description,
                p.CreatedAt,
                p.UpdatedAt
            FROM dbo.Places p
            LEFT JOIN dbo.Categories cat ON p.CategoryId = cat.Id
            LEFT JOIN dbo.Provinces prov ON p.ProvinceId = prov.Id
            WHERE p.Id = @Id;";

        var detail = await connection.QueryFirstOrDefaultAsync<AdminPlaceDetailDto>(sql, new { Id = id });
        if (detail == null) return null;

        // Kiểm tra quyền hạn phạm vi quản lý của Admin cấp 1
        if (!await AdminScopeFilterHelper.IsPlaceInScopeAsync(_currentUserService, connection, id))
        {
            return null;
        }

        const string mediaSql = "SELECT Url FROM dbo.PlaceMedia WHERE PlaceId = @Id ORDER BY DisplayOrder, Id;";
        var photos = (await connection.QueryAsync<string>(mediaSql, new { Id = id })).ToList();
        detail.Photos = photos;

        const string foodsSql = @"
            SELECT 
                f.Id,
                f.Name,
                f.MinPrice,
                f.MaxPrice,
                f.CoverImageUrl AS CoverImg,
                f.Description,
                CASE WHEN f.Status = 1 THEN 'active' ELSE 'hidden' END AS Status,
                CAST(f.Status AS INT) AS StatusNum
            FROM dbo.FoodPlaces fp
            INNER JOIN dbo.Foods f ON fp.FoodId = f.Id
            WHERE fp.PlaceId = @Id
            ORDER BY f.Name ASC;";
        var foods = (await connection.QueryAsync<AdminPlaceFoodDto>(foodsSql, new { Id = id })).ToList();
        detail.Foods = foods;

        return detail;
    }

    public async Task<long> CreateAdminPlaceAsync(CreateAdminPlaceInput input, long? creatorId, CancellationToken ct = default)
    {
        if (!AdminScopeFilterHelper.ValidatePlaceInputScope(_currentUserService, input.CategoryId, input.ProvinceId))
        {
            throw new UnauthorizedAccessException("Bạn không có quyền tạo địa điểm ngoài danh mục/tỉnh thành quản lý.");
        }

        var place = new Place(
            provinceId: input.ProvinceId,
            categoryId: input.CategoryId,
            name: input.Name,
            address: input.Address,
            createdBy: creatorId,
            description: input.Description,
            minPrice: input.MinPrice,
            maxPrice: input.MaxPrice,
            phone: input.Phone,
            website: input.Website,
            openingHours: input.Hours,
            latitude: input.Latitude,
            longitude: input.Longitude,
            coverImageUrl: input.PrimaryImageUrl);

        if (input.AutoApprove)
        {
            place.Approve();
        }

        _dbContext.Places.Add(place);
        await _dbContext.SaveChangesAsync(ct);

        var hasAdditionalChanges = false;
        if (input.Photos != null && input.Photos.Count > 0)
        {
            for (int i = 0; i < input.Photos.Count; i++)
            {
                place.AddMedia(input.Photos[i], MediaType.Image, i == 0);
            }
            hasAdditionalChanges = true;
        }

        if (input.FoodIds != null && input.FoodIds.Count > 0)
        {
            var distinctFoodIds = input.FoodIds.Where(fid => fid > 0).Distinct().ToList();
            if (distinctFoodIds.Count > 0)
            {
                var validFoodIds = await _dbContext.Foods
                    .Where(f => distinctFoodIds.Contains(f.Id))
                    .Select(f => f.Id)
                    .ToListAsync(ct);

                foreach (var fid in validFoodIds)
                {
                    _dbContext.FoodPlaces.Add(new FoodPlace(fid, place.Id));
                }
                hasAdditionalChanges = true;
            }
        }

        if (hasAdditionalChanges)
        {
            await _dbContext.SaveChangesAsync(ct);
        }

        await _auditLogService.LogAsync(
            actionType: "CREATE_PLACE",
            targetTable: "Places",
            targetId: place.Id,
            reason: $"Tạo mới địa điểm: {place.Name}",
            newData: new
            {
                Name = place.Name,
                Address = place.Address,
                CategoryId = place.CategoryId,
                ProvinceId = place.ProvinceId,
                Status = (int)place.Status,
                FoodIds = input.FoodIds
            },
            ct: ct);

        return place.Id;
    }

    public async Task<bool> UpdateAdminPlaceAsync(long id, UpdateAdminPlaceInput input, CancellationToken ct = default)
    {
        if (!await AdminScopeFilterHelper.IsPlaceInScopeAsync(_currentUserService, _dbContext.Database.GetDbConnection(), id))
            return false;

        var place = await _dbContext.Places.FirstOrDefaultAsync(p => p.Id == id, ct);
        if (place == null) return false;

        var oldFoodIds = await _dbContext.FoodPlaces
            .Where(fp => fp.PlaceId == id)
            .Select(fp => fp.FoodId)
            .ToListAsync(ct);

        var oldData = new
        {
            Name = place.Name,
            Address = place.Address,
            CategoryId = place.CategoryId,
            ProvinceId = place.ProvinceId,
            Phone = place.Phone,
            Website = place.Website,
            Hours = place.OpeningHours,
            MinPrice = place.MinPrice,
            MaxPrice = place.MaxPrice,
            FoodIds = oldFoodIds
        };

        var name = !string.IsNullOrWhiteSpace(input.Name) ? input.Name : place.Name;
        var address = !string.IsNullOrWhiteSpace(input.Address) ? input.Address : place.Address;
        var provinceId = (input.ProvinceId.HasValue && input.ProvinceId.Value > 0) ? input.ProvinceId.Value : place.ProvinceId;
        var categoryId = (input.CategoryId.HasValue && input.CategoryId.Value > 0) ? input.CategoryId.Value : place.CategoryId;

        if (!AdminScopeFilterHelper.ValidatePlaceInputScope(_currentUserService, categoryId, provinceId))
        {
            return false;
        }

        var description = input.Description ?? place.Description;
        var phone = input.Phone ?? place.Phone;
        var website = input.Website ?? place.Website;
        var hours = input.Hours ?? place.OpeningHours;
        var coverImg = input.PrimaryImageUrl ?? place.CoverImageUrl;

        place.UpdateDetails(
            name: name,
            address: address,
            provinceId: provinceId,
            categoryId: categoryId,
            description: description,
            phone: phone,
            website: website,
            openingHours: hours,
            coverImageUrl: coverImg);

        var minPrice = input.MinPrice ?? place.MinPrice;
        var maxPrice = input.MaxPrice ?? place.MaxPrice;
        place.UpdatePriceRange(minPrice, maxPrice);

        var lat = input.Latitude ?? place.Latitude;
        var lng = input.Longitude ?? place.Longitude;
        place.UpdateCoordinates(lat, lng);

        if (input.Photos != null && input.Photos.Count > 0)
        {
            var existingMedia = await _dbContext.PlaceMedia.Where(pm => pm.PlaceId == id).ToListAsync(ct);
            _dbContext.PlaceMedia.RemoveRange(existingMedia);

            for (int i = 0; i < input.Photos.Count; i++)
            {
                place.AddMedia(input.Photos[i], MediaType.Image, i == 0);
            }
        }

        var effectiveFoodIds = oldFoodIds;
        if (input.FoodIds != null)
        {
            var distinctFoodIds = input.FoodIds.Where(fid => fid > 0).Distinct().ToList();
            var validFoodIds = distinctFoodIds.Count > 0
                ? await _dbContext.Foods.Where(f => distinctFoodIds.Contains(f.Id)).Select(f => f.Id).ToListAsync(ct)
                : new List<long>();

            var existingFoodPlaces = await _dbContext.FoodPlaces
                .Where(fp => fp.PlaceId == id)
                .ToListAsync(ct);

            _dbContext.FoodPlaces.RemoveRange(existingFoodPlaces);

            foreach (var foodId in validFoodIds)
            {
                _dbContext.FoodPlaces.Add(new FoodPlace(foodId, id));
            }
            effectiveFoodIds = validFoodIds;
        }

        await _dbContext.SaveChangesAsync(ct);

        await _auditLogService.LogAsync(
            actionType: "UPDATE_PLACE",
            targetTable: "Places",
            targetId: id,
            reason: $"Cập nhật thông tin địa điểm: {place.Name}",
            oldData: oldData,
            newData: new
            {
                Name = place.Name,
                Address = place.Address,
                CategoryId = place.CategoryId,
                ProvinceId = place.ProvinceId,
                Phone = place.Phone,
                Website = place.Website,
                Hours = place.OpeningHours,
                MinPrice = place.MinPrice,
                MaxPrice = place.MaxPrice,
                FoodIds = effectiveFoodIds
            },
            ct: ct);

        return true;
    }

    public async Task<bool> UpdateAdminPlaceStatusAsync(long id, PlaceStatus status, CancellationToken ct = default)
    {
        if (!await AdminScopeFilterHelper.IsPlaceInScopeAsync(_currentUserService, _dbContext.Database.GetDbConnection(), id))
            return false;

        var place = await _dbContext.Places.FirstOrDefaultAsync(p => p.Id == id, ct);
        if (place == null) return false;

        var oldStatus = place.Status;
        place.UpdateStatus(status);
        await _dbContext.SaveChangesAsync(ct);

        await _auditLogService.LogAsync(
            actionType: "UPDATE_PLACE_STATUS",
            targetTable: "Places",
            targetId: id,
            reason: $"Cập nhật trạng thái địa điểm #{id} ({place.Name}) sang {status}",
            oldData: new { Status = (int)oldStatus },
            newData: new { Status = (int)status },
            ct: ct);

        return true;
    }

    public async Task<bool> DeleteAdminPlaceAsync(long id, CancellationToken ct = default)
    {
        if (!await AdminScopeFilterHelper.IsPlaceInScopeAsync(_currentUserService, _dbContext.Database.GetDbConnection(), id))
            return false;

        var place = await _dbContext.Places.FirstOrDefaultAsync(p => p.Id == id, ct);
        if (place == null) return false;

        var oldStatus = place.Status;
        // Xóa các bảng phụ thuộc hoặc xóa mềm sang Hidden
        place.UpdateStatus(PlaceStatus.Hidden);
        await _dbContext.SaveChangesAsync(ct);

        await _auditLogService.LogAsync(
            actionType: "DELETE_PLACE",
            targetTable: "Places",
            targetId: id,
            reason: $"Xóa (ẩn) địa điểm #{id} ({place.Name})",
            oldData: new { Status = (int)oldStatus },
            newData: new { Status = (int)PlaceStatus.Hidden },
            ct: ct);

        return true;
    }

    public async Task<(bool Success, string? OldCoverUrl)> UpdateCoverImageAsync(long placeId, string newCoverImageUrl, CancellationToken ct = default)
    {
        if (!await AdminScopeFilterHelper.IsPlaceInScopeAsync(_currentUserService, _dbContext.Database.GetDbConnection(), placeId))
            return (false, null);

        var place = await _dbContext.Places.FirstOrDefaultAsync(p => p.Id == placeId, ct);
        if (place == null) return (false, null);

        var oldCoverUrl = place.CoverImageUrl;
        place.UpdateCoverImage(newCoverImageUrl);
        await _dbContext.SaveChangesAsync(ct);

        await _auditLogService.LogAsync(
            actionType: "UPDATE_PLACE_COVER",
            targetTable: "Places",
            targetId: placeId,
            reason: $"Cập nhật ảnh đại diện cho địa điểm: {place.Name}",
            oldData: new { CoverImageUrl = oldCoverUrl },
            newData: new { CoverImageUrl = newCoverImageUrl },
            ct: ct);

        return (true, oldCoverUrl);
    }

    public async Task<List<PlaceMediaItemDto>> AddPlaceMediaAsync(long placeId, IEnumerable<string> mediaUrls, long? uploaderId, CancellationToken ct = default)
    {
        if (!await AdminScopeFilterHelper.IsPlaceInScopeAsync(_currentUserService, _dbContext.Database.GetDbConnection(), placeId))
            return new List<PlaceMediaItemDto>();

        var place = await _dbContext.Places.FirstOrDefaultAsync(p => p.Id == placeId, ct);
        if (place == null) return new List<PlaceMediaItemDto>();

        var maxOrder = await _dbContext.PlaceMedia
            .Where(pm => pm.PlaceId == placeId)
            .Select(pm => (int?)pm.DisplayOrder)
            .MaxAsync(ct) ?? -1;

        var addedItems = new List<PlaceMediaItemDto>();
        foreach (var url in mediaUrls)
        {
            if (string.IsNullOrWhiteSpace(url)) continue;
            maxOrder++;
            var media = new PlaceMedia(placeId, url.Trim(), MediaType.Image, maxOrder, uploaderId, isVerified: true);
            _dbContext.PlaceMedia.Add(media);
            addedItems.Add(new PlaceMediaItemDto
            {
                PlaceId = placeId,
                Url = url.Trim(),
                DisplayOrder = maxOrder,
                IsVerified = true,
                CreatedAt = DateTime.UtcNow
            });
        }

        await _dbContext.SaveChangesAsync(ct);

        await _auditLogService.LogAsync(
            actionType: "ADD_PLACE_MEDIA",
            targetTable: "Places",
            targetId: placeId,
            reason: $"Tải lên {addedItems.Count} ảnh vào bộ sưu tập địa điểm: {place.Name}",
            newData: new { PlaceId = placeId, Count = addedItems.Count, MediaUrls = mediaUrls },
            customAdminId: uploaderId,
            ct: ct);

        return addedItems;
    }

    public async Task<(bool Success, string? MediaUrl)> DeletePlaceMediaAsync(long placeId, long mediaId, CancellationToken ct = default)
    {
        if (!await AdminScopeFilterHelper.IsPlaceInScopeAsync(_currentUserService, _dbContext.Database.GetDbConnection(), placeId))
            return (false, null);

        var media = await _dbContext.PlaceMedia.FirstOrDefaultAsync(pm => pm.Id == mediaId && pm.PlaceId == placeId, ct);
        if (media == null) return (false, null);

        var url = media.Url;
        _dbContext.PlaceMedia.Remove(media);
        await _dbContext.SaveChangesAsync(ct);

        await _auditLogService.LogAsync(
            actionType: "DELETE_PLACE_MEDIA",
            targetTable: "PlaceMedia",
            targetId: mediaId,
            reason: $"Xóa ảnh #{mediaId} khỏi địa điểm #{placeId}",
            oldData: new { PlaceId = placeId, MediaId = mediaId, Url = url },
            ct: ct);

        return (true, url);
    }

    public async Task<List<PlaceMediaItemDto>> GetPlaceMediaListAsync(long placeId, CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();
        if (!await AdminScopeFilterHelper.IsPlaceInScopeAsync(_currentUserService, connection, placeId))
            return new List<PlaceMediaItemDto>();

        const string sql = @"
            SELECT 
                Id,
                PlaceId,
                Url,
                DisplayOrder,
                IsVerified,
                CreatedAt
            FROM dbo.PlaceMedia
            WHERE PlaceId = @PlaceId
            ORDER BY DisplayOrder, Id;";

        var list = await connection.QueryAsync<PlaceMediaItemDto>(sql, new { PlaceId = placeId });
        return list.ToList();
    }
}
