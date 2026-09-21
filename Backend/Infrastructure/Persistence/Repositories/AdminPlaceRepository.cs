using Application.Common;
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

    public AdminPlaceRepository(TravelReviewDbContext dbContext)
    {
        _dbContext = dbContext;
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

        var countSql = $"SELECT COUNT(1) FROM dbo.Places p {whereSql};";
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

        const string mediaSql = "SELECT MediaUrl FROM dbo.PlaceMedia WHERE PlaceId = @Id ORDER BY DisplayOrder, Id;";
        var photos = (await connection.QueryAsync<string>(mediaSql, new { Id = id })).ToList();
        detail.Photos = photos;

        return detail;
    }

    public async Task<long> CreateAdminPlaceAsync(CreateAdminPlaceInput input, long? creatorId, CancellationToken ct = default)
    {
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

        if (input.Photos != null && input.Photos.Count > 0)
        {
            for (int i = 0; i < input.Photos.Count; i++)
            {
                place.AddMedia(input.Photos[i], MediaType.Image, i == 0);
            }
            await _dbContext.SaveChangesAsync(ct);
        }

        return place.Id;
    }

    public async Task<bool> UpdateAdminPlaceAsync(long id, UpdateAdminPlaceInput input, CancellationToken ct = default)
    {
        var place = await _dbContext.Places.FirstOrDefaultAsync(p => p.Id == id, ct);
        if (place == null) return false;

        var name = !string.IsNullOrWhiteSpace(input.Name) ? input.Name : place.Name;
        var address = !string.IsNullOrWhiteSpace(input.Address) ? input.Address : place.Address;
        var provinceId = (input.ProvinceId.HasValue && input.ProvinceId.Value > 0) ? input.ProvinceId.Value : place.ProvinceId;
        var categoryId = (input.CategoryId.HasValue && input.CategoryId.Value > 0) ? input.CategoryId.Value : place.CategoryId;
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

        await _dbContext.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> UpdateAdminPlaceStatusAsync(long id, PlaceStatus status, CancellationToken ct = default)
    {
        var place = await _dbContext.Places.FirstOrDefaultAsync(p => p.Id == id, ct);
        if (place == null) return false;

        place.UpdateStatus(status);
        await _dbContext.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> DeleteAdminPlaceAsync(long id, CancellationToken ct = default)
    {
        var place = await _dbContext.Places.FirstOrDefaultAsync(p => p.Id == id, ct);
        if (place == null) return false;

        // Xóa các bảng phụ thuộc hoặc xóa mềm sang Hidden
        place.UpdateStatus(PlaceStatus.Hidden);
        await _dbContext.SaveChangesAsync(ct);
        return true;
    }
}
