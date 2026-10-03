using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using Dapper;
using Domain.Entities;
using Infrastructure.Persistence;
using Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class CollectionRepository : ICollectionRepository
{
    private readonly TravelReviewDbContext _dbContext;
    private readonly ICurrentUserService _currentUserService;

    public CollectionRepository(
        TravelReviewDbContext dbContext,
        ICurrentUserService currentUserService)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
    }

    public async Task<IReadOnlyList<CollectionDto>> GetFeaturedCollectionsAsync(int count, CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        const string sql = @"
            SELECT TOP (@Count) c.Id, c.ProvinceId, prov.Name AS ProvinceName, c.Title, c.IsFeatured, c.DisplayOrder,
                   (SELECT COUNT(1) FROM dbo.CollectionPlaces cp WHERE cp.CollectionId = c.Id) AS PlaceCount
            FROM dbo.Collections c
            LEFT JOIN dbo.Provinces prov ON c.ProvinceId = prov.Id
            WHERE c.Status = 1 AND c.IsFeatured = 1
            ORDER BY c.DisplayOrder;

            SELECT cp.CollectionId, p.Id, p.Name, p.AvgRating, p.ReviewCount
            FROM dbo.CollectionPlaces cp
            INNER JOIN dbo.Places p ON cp.PlaceId = p.Id
            INNER JOIN dbo.Collections c ON cp.CollectionId = c.Id
            WHERE c.Status = 1 AND c.IsFeatured = 1
            ORDER BY cp.CollectionId, cp.DisplayOrder;

            SELECT pm.PlaceId, pm.Url, pm.DisplayOrder
            FROM dbo.PlaceMedia pm
            INNER JOIN dbo.CollectionPlaces cp ON pm.PlaceId = cp.PlaceId
            INNER JOIN dbo.Collections c ON cp.CollectionId = c.Id
            WHERE c.Status = 1 AND c.IsFeatured = 1
            ORDER BY pm.PlaceId, pm.DisplayOrder;";

        using var multi = await connection.QueryMultipleAsync(sql, new { Count = count });
        var collections = (await multi.ReadAsync<CollectionDto>()).ToList();
        var places = (await multi.ReadAsync<PlaceInCollectionRaw>()).ToList();
        var medias = (await multi.ReadAsync<PlaceMediaRaw>()).ToList();

        var mediaByPlace = medias.ToLookup(m => m.PlaceId, m => m.Url);

        var placeCards = places.Select(p => new
        {
            p.CollectionId,
            Card = new PlaceCardDto
            {
                Id = p.Id,
                Name = p.Name,
                AvgRating = p.AvgRating,
                ReviewCount = p.ReviewCount,
                MediaUrls = mediaByPlace[p.Id].ToList()
            }
        }).ToLookup(p => p.CollectionId, p => p.Card);

        foreach (var col in collections)
        {
            col.Places = placeCards[col.Id].ToList();
        }

        return collections;
    }

    public async Task<Result<UpdateCollectionPlacesResultDto>> AddOrUpdatePlacesAsync(
        int collectionId,
        IReadOnlyList<CollectionPlaceInputDto> places,
        bool replaceExisting = false,
        string? description = null,
        int? provinceId = null,
        string? title = null,
        CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();
        if (!await AdminScopeFilterHelper.IsCollectionInScopeAsync(_currentUserService, connection, collectionId))
        {
            return Result<UpdateCollectionPlacesResultDto>.Failure("Bạn không có quyền cập nhật bộ sưu tập này.", System.Net.HttpStatusCode.Forbidden);
        }

        var collection = await _dbContext.Collections.FirstOrDefaultAsync(c => c.Id == collectionId, ct);
        if (collection == null)
        {
            return Result<UpdateCollectionPlacesResultDto>.NotFound($"Không tìm thấy bộ sưu tập với ID {collectionId}.");
        }

        if (!string.IsNullOrWhiteSpace(title))
        {
            collection.UpdateTitle(title.Trim());
        }

        if (description != null)
        {
            collection.UpdateDescription(string.IsNullOrWhiteSpace(description) ? null : description.Trim());
        }

        if (provinceId.HasValue)
        {
            if (provinceId.Value > 0)
            {
                var provExists = await _dbContext.Provinces.AnyAsync(p => p.Id == provinceId.Value, ct);
                if (!provExists)
                {
                    return Result<UpdateCollectionPlacesResultDto>.Failure($"Không tìm thấy tỉnh/thành với ID {provinceId.Value}.");
                }
                collection.UpdateProvince(provinceId.Value);
            }
            else
            {
                collection.UpdateProvince(null);
            }
        }

        var requestedPlaceIds = places.Select(p => p.PlaceId).Distinct().ToList();
        
        foreach (var pId in requestedPlaceIds)
        {
            if (!await AdminScopeFilterHelper.IsPlaceInScopeAsync(_currentUserService, connection, pId))
            {
                return Result<UpdateCollectionPlacesResultDto>.Failure($"Bạn không có quyền thao tác với địa điểm ID {pId}.", System.Net.HttpStatusCode.Forbidden);
            }
        }

        var validPlaces = await _dbContext.Places
            .Where(p => requestedPlaceIds.Contains(p.Id))
            .Select(p => p.Id)
            .ToListAsync(ct);

        var validPlaceIdSet = validPlaces.ToHashSet();

        if (requestedPlaceIds.Count > 0 && validPlaceIdSet.Count == 0)
        {
            return Result<UpdateCollectionPlacesResultDto>.Failure("Không tìm thấy địa điểm hợp lệ nào trong hệ thống từ danh sách đã cung cấp.");
        }

        int addedCount = 0;
        int updatedCount = 0;

        var existingPlaces = await _dbContext.CollectionPlaces
            .Where(cp => cp.CollectionId == collectionId)
            .ToListAsync(ct);

        var existingMap = existingPlaces.ToDictionary(cp => cp.PlaceId);

        if (replaceExisting)
        {
            var requestedValidPlaceIds = places
                .Where(p => validPlaceIdSet.Contains(p.PlaceId))
                .Select(p => p.PlaceId)
                .ToHashSet();

            // 1. Xóa các địa điểm cũ không còn trong danh sách yêu cầu
            var toRemove = existingPlaces.Where(cp => !requestedValidPlaceIds.Contains(cp.PlaceId)).ToList();
            if (toRemove.Count > 0)
            {
                _dbContext.CollectionPlaces.RemoveRange(toRemove);
            }

            // 2. Cập nhật thứ tự cho địa điểm đã có hoặc thêm mới vào DbSet
            int autoOrder = 1;
            foreach (var item in places)
            {
                if (!validPlaceIdSet.Contains(item.PlaceId)) continue;

                int order = item.DisplayOrder > 0 ? item.DisplayOrder : autoOrder++;
                if (existingMap.TryGetValue(item.PlaceId, out var existingCp))
                {
                    if (existingCp.DisplayOrder != order)
                    {
                        existingCp.UpdateDisplayOrder(order);
                        updatedCount++;
                    }
                }
                else
                {
                    _dbContext.CollectionPlaces.Add(new CollectionPlace(collectionId, item.PlaceId, order));
                    addedCount++;
                }
            }
        }
        else
        {
            int maxOrder = existingPlaces.Count > 0 ? existingPlaces.Max(cp => cp.DisplayOrder) : 0;

            foreach (var item in places)
            {
                if (!validPlaceIdSet.Contains(item.PlaceId)) continue;

                if (existingMap.TryGetValue(item.PlaceId, out var existingCp))
                {
                    if (item.DisplayOrder > 0 && item.DisplayOrder != existingCp.DisplayOrder)
                    {
                        existingCp.UpdateDisplayOrder(item.DisplayOrder);
                        updatedCount++;
                    }
                }
                else
                {
                    int order = item.DisplayOrder > 0 ? item.DisplayOrder : ++maxOrder;
                    _dbContext.CollectionPlaces.Add(new CollectionPlace(collectionId, item.PlaceId, order));
                    addedCount++;
                }
            }
        }

        await _dbContext.SaveChangesAsync(ct);

        // Lấy lại danh sách địa điểm của collection kèm media để trả về
        var updatedPlaceRows = await (
            from cp in _dbContext.CollectionPlaces
            join p in _dbContext.Places on cp.PlaceId equals p.Id
            where cp.CollectionId == collectionId
            orderby cp.DisplayOrder
            select new
            {
                p.Id,
                p.Name,
                p.AvgRating,
                p.ReviewCount
            }
        ).ToListAsync(ct);

        var placeIds = updatedPlaceRows.Select(p => p.Id).ToList();
        var medias = await _dbContext.PlaceMedia
            .Where(m => placeIds.Contains(m.PlaceId))
            .OrderBy(m => m.DisplayOrder)
            .Select(m => new { m.PlaceId, m.Url })
            .ToListAsync(ct);

        var mediaMap = medias.ToLookup(m => m.PlaceId, m => m.Url);

        var placeCards = updatedPlaceRows.Select(p => new PlaceCardDto
        {
            Id = p.Id,
            Name = p.Name,
            AvgRating = p.AvgRating,
            ReviewCount = p.ReviewCount,
            MediaUrls = mediaMap[p.Id].ToList()
        }).ToList();

        string provinceName = "Toàn quốc";
        if (collection.ProvinceId.HasValue)
        {
            var prov = await _dbContext.Provinces.FirstOrDefaultAsync(p => p.Id == collection.ProvinceId.Value, ct);
            if (prov != null)
            {
                provinceName = prov.Name;
            }
        }

        var resultDto = new UpdateCollectionPlacesResultDto
        {
            CollectionId = collectionId,
            Title = collection.Title,
            Description = collection.Description,
            ProvinceId = collection.ProvinceId,
            ProvinceName = provinceName,
            TotalPlaces = placeCards.Count,
            AddedCount = addedCount,
            UpdatedCount = updatedCount,
            Places = placeCards
        };

        return Result<UpdateCollectionPlacesResultDto>.Success(resultDto, "Cập nhật địa điểm cho bộ sưu tập thành công.");
    }

    public async Task<IReadOnlyList<AdminCollectionSummaryDto>> GetAdminCollectionsAsync(CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        var whereClauses = new List<string> { "1=1" };
        var parameters = new DynamicParameters();

        AdminScopeFilterHelper.ApplyCollectionScope(_currentUserService, whereClauses, parameters, "c");

        var whereSql = " WHERE " + string.Join(" AND ", whereClauses);

        var sql = $@"
            SELECT 
                c.Id, 
                c.ProvinceId, 
                COALESCE(prov.Name, N'Toàn quốc') AS ProvinceName, 
                c.Title, 
                c.Description,
                c.IsFeatured, 
                c.DisplayOrder,
                CAST(c.Status AS INT) AS Status,
                (SELECT COUNT(1) FROM dbo.CollectionPlaces cp WHERE cp.CollectionId = c.Id) AS PlaceCount
            FROM dbo.Collections c
            LEFT JOIN dbo.Provinces prov ON c.ProvinceId = prov.Id
            {whereSql}
            ORDER BY c.DisplayOrder, c.Id;";

        var rows = await connection.QueryAsync<AdminCollectionSummaryDto>(sql, parameters);
        return rows.ToList();
    }

    public async Task<Result<AdminCollectionDetailPlacesDto>> GetCollectionPlacesDetailAsync(int collectionId, CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        if (!await AdminScopeFilterHelper.IsCollectionInScopeAsync(_currentUserService, connection, collectionId))
        {
            return Result<AdminCollectionDetailPlacesDto>.Failure("Bạn không có quyền xem bộ sưu tập này.", System.Net.HttpStatusCode.Forbidden);
        }

        const string sql = @"
            SELECT 
                c.Id, 
                c.Title, 
                c.Description, 
                c.ProvinceId, 
                COALESCE(prov.Name, N'Toàn quốc') AS ProvinceName, 
                c.CoverImageUrl AS CoverUrl, 
                c.IsFeatured, 
                c.DisplayOrder, 
                CAST(c.Status AS INT) AS Status,
                (SELECT COUNT(1) FROM dbo.CollectionPlaces cp WHERE cp.CollectionId = c.Id) AS PlaceCount
            FROM dbo.Collections c
            LEFT JOIN dbo.Provinces prov ON c.ProvinceId = prov.Id
            WHERE c.Id = @CollectionId;

            SELECT 
                p.Id,
                p.Name,
                p.Description,
                cat.Name AS CategoryName,
                prov.Name AS ProvinceName,
                p.Address,
                CAST(p.AvgRating AS FLOAT) AS AvgRating,
                p.ReviewCount,
                cp.DisplayOrder,
                COALESCE(p.CoverImageUrl, (SELECT TOP 1 pm.Url FROM dbo.PlaceMedia pm WHERE pm.PlaceId = p.Id ORDER BY pm.DisplayOrder)) AS CoverUrl
            FROM dbo.CollectionPlaces cp
            INNER JOIN dbo.Places p ON cp.PlaceId = p.Id
            LEFT JOIN dbo.Categories cat ON p.CategoryId = cat.Id
            LEFT JOIN dbo.Provinces prov ON p.ProvinceId = prov.Id
            WHERE cp.CollectionId = @CollectionId AND p.Status = 1
            ORDER BY cp.DisplayOrder, p.Id;";

        using var multi = await connection.QueryMultipleAsync(sql, new { CollectionId = collectionId });
        var collection = await multi.ReadFirstOrDefaultAsync<AdminCollectionDetailPlacesDto>();
        if (collection == null)
        {
            return Result<AdminCollectionDetailPlacesDto>.NotFound($"Không tìm thấy bộ sưu tập với ID {collectionId}.");
        }

        var places = (await multi.ReadAsync<AdminCollectionPlaceDetailDto>()).ToList();
        collection.Places = places;

        return Result<AdminCollectionDetailPlacesDto>.Success(collection, "Lấy chi tiết bộ sưu tập và danh sách địa điểm thành công.");
    }

    public async Task<Result<AdminCollectionCreatedDto>> CreateCollectionAsync(
        string title,
        string? description,
        int? provinceId,
        string? coverUrl,
        int? displayOrder,
        bool isFeatured,
        int? status,
        IReadOnlyList<CollectionPlaceInputDto>? places,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(title))
        {
            return Result<AdminCollectionCreatedDto>.Failure("Tiêu đề bộ sưu tập không được để trống.");
        }

        if (!_currentUserService.IsSystemAdmin)
        {
            var provScopes = _currentUserService.ProvinceScopes;
            if (provScopes.Count > 0 && (!provinceId.HasValue || !provScopes.Contains(provinceId.Value)))
            {
                return Result<AdminCollectionCreatedDto>.Failure("Bạn không có quyền tạo bộ sưu tập ngoài phạm vi tỉnh thành quản lý.", System.Net.HttpStatusCode.Forbidden);
            }
        }

        string? provinceName = null;
        if (provinceId.HasValue && provinceId.Value > 0)
        {
            var province = await _dbContext.Provinces.AsNoTracking().FirstOrDefaultAsync(p => p.Id == provinceId.Value, ct);
            if (province == null)
            {
                return Result<AdminCollectionCreatedDto>.Failure($"Không tìm thấy tỉnh/thành phố với ID {provinceId.Value}.");
            }
            provinceName = province.Name;
        }
        else
        {
            provinceId = null;
            provinceName = "Toàn quốc";
        }

        int finalOrder = displayOrder ?? 0;
        if (finalOrder <= 0)
        {
            var maxOrder = await _dbContext.Collections.MaxAsync(c => (int?)c.DisplayOrder, ct) ?? 0;
            finalOrder = maxOrder + 1;
        }

        var recordStatus = (status ?? 1) == 0 ? Domain.Enums.RecordStatus.Inactive : Domain.Enums.RecordStatus.Active;

        var collection = new Collection(
            title.Trim(),
            provinceId,
            description?.Trim(),
            coverUrl?.Trim(),
            isFeatured,
            finalOrder,
            recordStatus);

        _dbContext.Collections.Add(collection);
        await _dbContext.SaveChangesAsync(ct);

        int placeCount = 0;
        if (places != null && places.Count > 0)
        {
            var validPlacesInput = places.Where(p => p.PlaceId > 0).ToList();
            var requestedPlaceIds = validPlacesInput.Select(p => p.PlaceId).Distinct().ToList();

            if (requestedPlaceIds.Count > 0)
            {
                var existingPlaceIds = await _dbContext.Places
                    .Where(p => requestedPlaceIds.Contains(p.Id))
                    .Select(p => p.Id)
                    .ToListAsync(ct);

                var existingPlaceIdSet = existingPlaceIds.ToHashSet();

                int autoOrder = 1;
                var addedPlaceIds = new HashSet<long>();
                foreach (var p in validPlacesInput)
                {
                    if (existingPlaceIdSet.Contains(p.PlaceId) && addedPlaceIds.Add(p.PlaceId))
                    {
                        int order = p.DisplayOrder > 0 ? p.DisplayOrder : autoOrder++;
                        _dbContext.CollectionPlaces.Add(new CollectionPlace(collection.Id, p.PlaceId, order));
                    }
                }

                if (addedPlaceIds.Count > 0)
                {
                    await _dbContext.SaveChangesAsync(ct);
                    placeCount = addedPlaceIds.Count;
                }
            }
        }

        var resultDto = new AdminCollectionCreatedDto
        {
            Id = collection.Id,
            Title = collection.Title,
            ProvinceId = collection.ProvinceId,
            ProvinceName = provinceName,
            PlaceCount = placeCount,
            DisplayOrder = collection.DisplayOrder,
            Status = (int)collection.Status,
            CreatedAt = collection.CreatedAt
        };

        return Result<AdminCollectionCreatedDto>.Created(resultDto, "Tạo bộ sưu tập thành công.");
    }

    public async Task<Result<UpdateCollectionStatusResultDto>> UpdateStatusAsync(int id, int status, CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();
        if (!await AdminScopeFilterHelper.IsCollectionInScopeAsync(_currentUserService, connection, id))
        {
            return Result<UpdateCollectionStatusResultDto>.Failure("Bạn không có quyền cập nhật bộ sưu tập này.", System.Net.HttpStatusCode.Forbidden);
        }

        var collection = await _dbContext.Collections.FirstOrDefaultAsync(c => c.Id == id, ct);
        if (collection == null)
        {
            return Result<UpdateCollectionStatusResultDto>.NotFound($"Không tìm thấy bộ sưu tập với ID {id}.");
        }

        var recordStatus = status == 1 ? Domain.Enums.RecordStatus.Active : Domain.Enums.RecordStatus.Inactive;
        collection.UpdateStatus(recordStatus);
        await _dbContext.SaveChangesAsync(ct);

        var resultDto = new UpdateCollectionStatusResultDto
        {
            Id = collection.Id,
            Status = (int)collection.Status,
            StatusText = collection.Status == Domain.Enums.RecordStatus.Active ? "Đang hoạt động" : "Tạm ẩn"
        };

        return Result<UpdateCollectionStatusResultDto>.Success(resultDto, $"Đã cập nhật trạng thái bộ sưu tập sang '{resultDto.StatusText}'.");
    }
}
