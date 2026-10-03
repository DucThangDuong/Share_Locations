using System.Text.Json;
using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs.Admin;
using Dapper;
using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class AdminProposalRepository : IAdminProposalRepository
{
    private readonly TravelReviewDbContext _dbContext;
    private readonly ICurrentUserService _currentUserService;
    private readonly IBlobService _blobService;

    public AdminProposalRepository(
        TravelReviewDbContext dbContext,
        ICurrentUserService currentUserService,
        IBlobService blobService)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
        _blobService = blobService;
    }

    public async Task<PagedResult<AdminProposalSummaryDto>> GetProposalsAsync(
        int? status,
        string? keyword,
        int? provinceId,
        int page,
        int pageSize,
        CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        var scopeWhereClauses = new List<string>();
        var parameters = new DynamicParameters();

        // 1. Giới hạn phân quyền theo Scope của Admin cấp 1
        if (!_currentUserService.IsSystemAdmin)
        {
            var catScopes = _currentUserService.CategoryScopes;
            var provScopes = _currentUserService.ProvinceScopes;
            var regScopes = _currentUserService.RegionScopes;

            if (catScopes.Count == 0 && provScopes.Count == 0 && regScopes.Count == 0)
            {
                scopeWhereClauses.Add("1 = 0");
            }
            else
            {
                if (catScopes.Count > 0)
                {
                    scopeWhereClauses.Add("COALESCE(p.CategoryId, targetP.CategoryId, TRY_CAST(JSON_VALUE(p.ProposedDataJSON, '$.categoryId') AS INT)) IN @ScopeCategoryIds");
                    parameters.Add("ScopeCategoryIds", catScopes);
                }

                if (provScopes.Count > 0 && regScopes.Count > 0)
                {
                    scopeWhereClauses.Add("(COALESCE(p.ProvinceId, targetP.ProvinceId, TRY_CAST(JSON_VALUE(p.ProposedDataJSON, '$.provinceId') AS INT)) IN @ScopeProvinceIds OR prov.RegionId IN @ScopeRegionIds)");
                    parameters.Add("ScopeProvinceIds", provScopes);
                    parameters.Add("ScopeRegionIds", regScopes);
                }
                else if (provScopes.Count > 0)
                {
                    scopeWhereClauses.Add("COALESCE(p.ProvinceId, targetP.ProvinceId, TRY_CAST(JSON_VALUE(p.ProposedDataJSON, '$.provinceId') AS INT)) IN @ScopeProvinceIds");
                    parameters.Add("ScopeProvinceIds", provScopes);
                }
                else if (regScopes.Count > 0)
                {
                    scopeWhereClauses.Add("prov.RegionId IN @ScopeRegionIds");
                    parameters.Add("ScopeRegionIds", regScopes);
                }
            }
        }

        // Lọc theo ProvinceId nếu có
        if (provinceId.HasValue && provinceId.Value > 0)
        {
            scopeWhereClauses.Add("COALESCE(p.ProvinceId, targetP.ProvinceId, TRY_CAST(JSON_VALUE(p.ProposedDataJSON, '$.provinceId') AS INT)) = @ProvinceId");
            parameters.Add("ProvinceId", provinceId.Value);
        }

        // Lọc theo Keyword / Search nếu có
        if (!string.IsNullOrWhiteSpace(keyword))
        {
            scopeWhereClauses.Add(@"(
                COALESCE(prof.FullName, u.Email) LIKE @Keyword 
                OR targetP.Name LIKE @Keyword 
                OR JSON_VALUE(p.ProposedDataJSON, '$.name') LIKE @Keyword
                OR JSON_VALUE(p.ProposedDataJSON, '$.Name') LIKE @Keyword
                OR targetP.Address LIKE @Keyword
                OR JSON_VALUE(p.ProposedDataJSON, '$.address') LIKE @Keyword
            )");
            parameters.Add("Keyword", $"%{keyword.Trim()}%");
        }

        var scopeWhereSql = scopeWhereClauses.Count > 0 ? " WHERE " + string.Join(" AND ", scopeWhereClauses) : "";

        // Đếm số lượng theo từng trạng thái (Pending, Approved, Rejected) trong phạm vi quản lý
        var countsSql = $@"
            SELECT 
                COUNT(CASE WHEN p.Status = 0 THEN 1 END) AS PendingCount,
                COUNT(CASE WHEN p.Status = 1 THEN 1 END) AS ApprovedCount,
                COUNT(CASE WHEN p.Status = 2 THEN 1 END) AS RejectedCount
            FROM dbo.Proposals p
            LEFT JOIN dbo.Users u ON p.UserId = u.Id
            LEFT JOIN dbo.UserProfiles prof ON u.Id = prof.UserId
            LEFT JOIN dbo.Places targetP ON p.TargetPlaceId = targetP.Id
            LEFT JOIN dbo.Provinces prov ON COALESCE(p.ProvinceId, targetP.ProvinceId, TRY_CAST(JSON_VALUE(p.ProposedDataJSON, '$.provinceId') AS INT)) = prov.Id
            {scopeWhereSql};";

        var counts = await connection.QueryFirstOrDefaultAsync<(int PendingCount, int ApprovedCount, int RejectedCount)>(countsSql, parameters);

        // Áp dụng filter status cho dữ liệu phân trang hiện tại
        var whereClauses = new List<string>(scopeWhereClauses);
        if (status.HasValue)
        {
            whereClauses.Add("p.Status = @Status");
            parameters.Add("Status", status.Value);
        }

        var whereSql = whereClauses.Count > 0 ? " WHERE " + string.Join(" AND ", whereClauses) : "";

        var countSql = $@"
            SELECT COUNT(1)
            FROM dbo.Proposals p
            LEFT JOIN dbo.Users u ON p.UserId = u.Id
            LEFT JOIN dbo.UserProfiles prof ON u.Id = prof.UserId
            LEFT JOIN dbo.Places targetP ON p.TargetPlaceId = targetP.Id
            LEFT JOIN dbo.Provinces prov ON COALESCE(p.ProvinceId, targetP.ProvinceId, TRY_CAST(JSON_VALUE(p.ProposedDataJSON, '$.provinceId') AS INT)) = prov.Id
            {whereSql};";

        var totalCount = await connection.ExecuteScalarAsync<int>(countSql, parameters);

        var offset = Math.Max(0, (page - 1) * pageSize);
        parameters.Add("Offset", offset);
        parameters.Add("PageSize", pageSize);

        var querySql = $@"
            SELECT 
                p.Id,
                COALESCE(targetP.Name, JSON_VALUE(p.ProposedDataJSON, '$.name'), JSON_VALUE(p.ProposedDataJSON, '$.Name'), N'Đề xuất địa điểm mới') AS PlaceName,
                COALESCE(
                    targetP.CoverImageUrl,
                    JSON_VALUE(p.ProposedDataJSON, '$.coverImg'),
                    JSON_VALUE(p.ProposedDataJSON, '$.CoverImg'),
                    JSON_VALUE(p.ProposedDataJSON, '$.primaryImageUrl'),
                    (SELECT TOP 1 pm.Url FROM dbo.PlaceMedia pm WHERE pm.PlaceId = targetP.Id ORDER BY pm.DisplayOrder)
                ) AS CoverImg,
                COALESCE(targetP.Address, JSON_VALUE(p.ProposedDataJSON, '$.address'), JSON_VALUE(p.ProposedDataJSON, '$.Address'), JSON_VALUE(p.ProposedDataJSON, '$.location'), N'') AS Address,
                cat.Name AS CategoryName,
                prov.Name AS ProvinceName,
                COALESCE(prof.FullName, u.Email, N'Người dùng') AS ProposerName,
                prof.AvatarUrl AS ProposerAvatar,
                CAST(p.Status AS INT) AS Status,
                p.CreatedAt AS SubmittedAt,
                p.AdminNote,
                p.RejectReason
            FROM dbo.Proposals p
            LEFT JOIN dbo.Users u ON p.UserId = u.Id
            LEFT JOIN dbo.UserProfiles prof ON u.Id = prof.UserId
            LEFT JOIN dbo.Places targetP ON p.TargetPlaceId = targetP.Id
            LEFT JOIN dbo.Categories cat ON COALESCE(p.CategoryId, targetP.CategoryId, TRY_CAST(JSON_VALUE(p.ProposedDataJSON, '$.categoryId') AS INT)) = cat.Id
            LEFT JOIN dbo.Provinces prov ON COALESCE(p.ProvinceId, targetP.ProvinceId, TRY_CAST(JSON_VALUE(p.ProposedDataJSON, '$.provinceId') AS INT)) = prov.Id
            {whereSql}
            ORDER BY p.CreatedAt DESC
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;";

        var items = (await connection.QueryAsync<AdminProposalSummaryDto>(querySql, parameters)).ToList();

        var pagedResult = new PagedResult<AdminProposalSummaryDto>(items, totalCount, page, pageSize)
        {
            PendingCount = counts.PendingCount,
            ApprovedCount = counts.ApprovedCount,
            RejectedCount = counts.RejectedCount
        };

        return pagedResult;
    }

    public async Task<AdminProposalDetailDto?> GetProposalDetailAsync(long id, CancellationToken ct = default)
    {
        if (!await IsProposalInScopeAsync(id)) return null;

        var connection = _dbContext.Database.GetDbConnection();

        const string sql = @"
            SELECT 
                p.Id,
                CASE WHEN p.TargetPlaceId IS NULL THEN 'new_place' ELSE 'update_info' END AS Type,
                CAST(p.Status AS INT) AS Status,
                p.CreatedAt AS SubmittedAt,
                p.AdminNote,
                p.RejectReason,
                p.ProposedDataJSON AS ProposedDataJson,
                p.TargetPlaceId,
                -- Proposer
                u.Id AS ProposerId,
                COALESCE(prof.FullName, u.Email, N'Người dùng') AS ProposerName,
                u.Email AS ProposerEmail,
                prof.AvatarUrl AS ProposerAvatarUrl,
                -- Target place nếu có
                targetP.Name AS TargetPlaceName,
                targetP.CategoryId AS TargetCategoryId,
                cat.Name AS TargetCategoryName,
                targetP.ProvinceId AS TargetProvinceId,
                prov.Name AS TargetProvinceName,
                targetP.Address AS TargetAddress,
                targetP.Latitude AS TargetLatitude,
                targetP.Longitude AS TargetLongitude,
                targetP.Phone AS TargetPhone,
                targetP.Website AS TargetWebsite,
                targetP.OpeningHours AS TargetOpeningHours,
                targetP.MinPrice AS TargetMinPrice,
                targetP.MaxPrice AS TargetMaxPrice,
                targetP.Description AS TargetDescription,
                targetP.CoverImageUrl AS TargetCoverImageUrl
            FROM dbo.Proposals p
            LEFT JOIN dbo.Users u ON p.UserId = u.Id
            LEFT JOIN dbo.UserProfiles prof ON u.Id = prof.UserId
            LEFT JOIN dbo.Places targetP ON p.TargetPlaceId = targetP.Id
            LEFT JOIN dbo.Categories cat ON COALESCE(p.CategoryId, targetP.CategoryId) = cat.Id
            LEFT JOIN dbo.Provinces prov ON COALESCE(p.ProvinceId, targetP.ProvinceId) = prov.Id
            WHERE p.Id = @Id;";

        var row = await connection.QueryFirstOrDefaultAsync<dynamic>(sql, new { Id = id });
        if (row == null) return null;

        var detail = new AdminProposalDetailDto
        {
            Id = (long)row.Id,
            Type = (string)row.Type,
            Status = (int)row.Status,
            SubmittedAt = (DateTime)row.SubmittedAt,
            AdminNote = (string?)row.AdminNote,
            RejectReason = (string?)row.RejectReason,
            Proposer = new ProposalProposerDto
            {
                Id = (long)row.ProposerId,
                Name = (string)row.ProposerName,
                Email = (string?)row.ProposerEmail,
                AvatarUrl = (string?)row.ProposerAvatarUrl
            }
        };

        var placeData = new ProposalPlaceDataDto
        {
            Name = (string?)row.TargetPlaceName ?? string.Empty,
            CategoryId = (int?)row.TargetCategoryId,
            CategoryName = (string?)row.TargetCategoryName,
            ProvinceId = (int?)row.TargetProvinceId,
            ProvinceName = (string?)row.TargetProvinceName,
            Address = (string?)row.TargetAddress ?? string.Empty,
            Latitude = (decimal?)row.TargetLatitude,
            Longitude = (decimal?)row.TargetLongitude,
            Phone = (string?)row.TargetPhone,
            Website = (string?)row.TargetWebsite,
            OpeningHours = (string?)row.TargetOpeningHours,
            MinPrice = (decimal?)row.TargetMinPrice,
            MaxPrice = (decimal?)row.TargetMaxPrice,
            Description = (string?)row.TargetDescription,
            CoverImg = (string?)row.TargetCoverImageUrl
        };

        string rawJson = (string)(row.ProposedDataJson ?? "{}");
        if (!string.IsNullOrWhiteSpace(rawJson) && rawJson != "{}")
        {
            try
            {
                using var doc = JsonDocument.Parse(rawJson);
                var root = doc.RootElement;

                if (root.TryGetProperty("name", out var pName) || root.TryGetProperty("Name", out pName))
                {
                    var val = pName.GetString();
                    if (!string.IsNullOrWhiteSpace(val)) placeData.Name = val;
                }

                if ((root.TryGetProperty("categoryId", out var pCatId) || root.TryGetProperty("CategoryId", out pCatId)) && pCatId.TryGetInt32(out var cId))
                {
                    placeData.CategoryId = cId;
                }

                if (root.TryGetProperty("categoryName", out var pCatName) || root.TryGetProperty("CategoryName", out pCatName) || root.TryGetProperty("category", out pCatName))
                {
                    var val = pCatName.GetString();
                    if (!string.IsNullOrWhiteSpace(val)) placeData.CategoryName = val;
                }

                if ((root.TryGetProperty("provinceId", out var pProvId) || root.TryGetProperty("ProvinceId", out pProvId)) && pProvId.TryGetInt32(out var pvId))
                {
                    placeData.ProvinceId = pvId;
                }

                if (root.TryGetProperty("provinceName", out var pProvName) || root.TryGetProperty("ProvinceName", out pProvName) || root.TryGetProperty("province", out pProvName))
                {
                    var val = pProvName.GetString();
                    if (!string.IsNullOrWhiteSpace(val)) placeData.ProvinceName = val;
                }

                if (root.TryGetProperty("address", out var pAddr) || root.TryGetProperty("Address", out pAddr) || root.TryGetProperty("location", out pAddr))
                {
                    var val = pAddr.GetString();
                    if (!string.IsNullOrWhiteSpace(val)) placeData.Address = val;
                }

                if (root.TryGetProperty("latitude", out var pLat) || root.TryGetProperty("Latitude", out pLat) || root.TryGetProperty("lat", out pLat))
                {
                    if (pLat.TryGetDecimal(out var dLat)) placeData.Latitude = dLat;
                }

                if (root.TryGetProperty("longitude", out var pLng) || root.TryGetProperty("Longitude", out pLng) || root.TryGetProperty("lng", out pLng))
                {
                    if (pLng.TryGetDecimal(out var dLng)) placeData.Longitude = dLng;
                }

                if (root.TryGetProperty("phone", out var pPhone) || root.TryGetProperty("Phone", out pPhone))
                {
                    var val = pPhone.GetString();
                    if (!string.IsNullOrWhiteSpace(val)) placeData.Phone = val;
                }

                if (root.TryGetProperty("website", out var pWeb) || root.TryGetProperty("Website", out pWeb))
                {
                    var val = pWeb.GetString();
                    if (!string.IsNullOrWhiteSpace(val)) placeData.Website = val;
                }

                if (root.TryGetProperty("openingHours", out var pOpen) || root.TryGetProperty("OpeningHours", out pOpen) || root.TryGetProperty("hours", out pOpen))
                {
                    var val = pOpen.GetString();
                    if (!string.IsNullOrWhiteSpace(val)) placeData.OpeningHours = val;
                }

                if (root.TryGetProperty("minPrice", out var pMin) || root.TryGetProperty("MinPrice", out pMin))
                {
                    if (pMin.TryGetDecimal(out var dMin)) placeData.MinPrice = dMin;
                }

                if (root.TryGetProperty("maxPrice", out var pMax) || root.TryGetProperty("MaxPrice", out pMax))
                {
                    if (pMax.TryGetDecimal(out var dMax)) placeData.MaxPrice = dMax;
                }

                if (root.TryGetProperty("isFree", out var pFree) || root.TryGetProperty("IsFree", out pFree))
                {
                    if (pFree.ValueKind == JsonValueKind.True || pFree.ValueKind == JsonValueKind.False)
                    {
                        placeData.IsFree = pFree.GetBoolean();
                    }
                }
                else
                {
                    placeData.IsFree = (placeData.MinPrice == 0 && placeData.MaxPrice == 0);
                }

                if (root.TryGetProperty("description", out var pDesc) || root.TryGetProperty("Description", out pDesc) || root.TryGetProperty("desc", out pDesc))
                {
                    var val = pDesc.GetString();
                    if (!string.IsNullOrWhiteSpace(val)) placeData.Description = val;
                }

                if (root.TryGetProperty("coverImg", out var pCover) || root.TryGetProperty("CoverImg", out pCover) || root.TryGetProperty("primaryImageUrl", out pCover) || root.TryGetProperty("img", out pCover))
                {
                    var val = pCover.GetString();
                    if (!string.IsNullOrWhiteSpace(val)) placeData.CoverImg = val;
                }

                // Parse images
                var imgPropNames = new[] { "images", "Images", "photos", "Photos", "mediaUrls", "MediaUrls" };
                foreach (var propName in imgPropNames)
                {
                    if (root.TryGetProperty(propName, out var pImgs) && pImgs.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var elem in pImgs.EnumerateArray())
                        {
                            var u = elem.GetString();
                            if (!string.IsNullOrWhiteSpace(u) && !placeData.Images.Contains(u))
                            {
                                placeData.Images.Add(u);
                            }
                        }
                        break;
                    }
                }

                // Tự động chuyển đổi và di chuyển dữ liệu Base64 cũ (nếu có) sang Azure Blob Storage
                bool needsDbUpdate = false;
                if (!string.IsNullOrWhiteSpace(placeData.CoverImg) && placeData.CoverImg.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase))
                {
                    try
                    {
                        var azureUrl = await _blobService.UploadBase64ImageAsync(placeData.CoverImg, "places", ct);
                        placeData.CoverImg = azureUrl;
                        needsDbUpdate = true;
                    }
                    catch
                    {
                        // Giữ fallback nếu upload blob lỗi
                    }
                }

                for (int i = 0; i < placeData.Images.Count; i++)
                {
                    var img = placeData.Images[i];
                    if (!string.IsNullOrWhiteSpace(img) && img.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase))
                    {
                        try
                        {
                            var azureUrl = await _blobService.UploadBase64ImageAsync(img, "places", ct);
                            placeData.Images[i] = azureUrl;
                            needsDbUpdate = true;
                        }
                        catch
                        {
                            // Giữ fallback nếu upload blob lỗi
                        }
                    }
                }

                if (needsDbUpdate)
                {
                    try
                    {
                        // Cập nhật lại ProposedDataJSON trong DB thành URL sạch của Azure
                        var updatedDict = JsonSerializer.Deserialize<Dictionary<string, object>>(rawJson) ?? new();
                        if (!string.IsNullOrWhiteSpace(placeData.CoverImg))
                        {
                            updatedDict["coverImg"] = placeData.CoverImg;
                        }
                        if (placeData.Images.Count > 0)
                        {
                            updatedDict["mediaUrls"] = placeData.Images;
                            updatedDict["images"] = placeData.Images;
                        }
                        var updatedJson = JsonSerializer.Serialize(updatedDict);
                        await connection.ExecuteAsync(
                            "UPDATE dbo.Proposals SET ProposedDataJSON = @Json WHERE Id = @Id",
                            new { Json = updatedJson, Id = id });
                    }
                    catch
                    {
                        // Bỏ qua lỗi cập nhật nền
                    }
                }
            }
            catch
            {
                // Fallback on json parse
            }
        }

        // Bổ sung tên Category hoặc Province từ DB nếu còn thiếu
        if (string.IsNullOrWhiteSpace(placeData.CategoryName) && placeData.CategoryId.HasValue)
        {
            placeData.CategoryName = await connection.QueryFirstOrDefaultAsync<string>(
                "SELECT Name FROM dbo.Categories WHERE Id = @CatId", new { CatId = placeData.CategoryId.Value });
        }

        if (string.IsNullOrWhiteSpace(placeData.ProvinceName) && placeData.ProvinceId.HasValue)
        {
            placeData.ProvinceName = await connection.QueryFirstOrDefaultAsync<string>(
                "SELECT Name FROM dbo.Provinces WHERE Id = @ProvId", new { ProvId = placeData.ProvinceId.Value });
        }

        // Nếu là update_info và placeData.Images vẫn trống, lấy từ bảng PlaceMedia của TargetPlaceId
        if (placeData.Images.Count == 0 && row.TargetPlaceId != null)
        {
            long tPlaceId = (long)row.TargetPlaceId;
            const string mediaSql = "SELECT Url FROM dbo.PlaceMedia WHERE PlaceId = @PlaceId ORDER BY DisplayOrder, Id;";
            var pMedias = (await connection.QueryAsync<string>(mediaSql, new { PlaceId = tPlaceId })).ToList();
            placeData.Images = pMedias;
        }

        detail.PlaceData = placeData;
        return detail;
    }

    public async Task<bool> ApproveProposalAsync(
        long id,
        long adminId,
        long? targetPlaceId = null,
        string? adminNote = null,
        CancellationToken ct = default)
    {
        if (!await IsProposalInScopeAsync(id)) return false;

        var proposal = await _dbContext.Proposals.FirstOrDefaultAsync(p => p.Id == id, ct);
        if (proposal == null) return false;

        // Trích xuất dữ liệu từ ProposedDataJSON
        string rawJson = proposal.ProposedDataJSON ?? "{}";
        string name = string.Empty;
        string address = string.Empty;
        int provinceId = proposal.ProvinceId ?? 0;
        int categoryId = proposal.CategoryId ?? 0;
        string? description = null;
        string? phone = null;
        string? website = null;
        string? openingHours = null;
        decimal? minPrice = null;
        decimal? maxPrice = null;
        decimal? latitude = null;
        decimal? longitude = null;
        string? coverImg = null;
        var images = new List<string>();

        if (!string.IsNullOrWhiteSpace(rawJson) && rawJson != "{}")
        {
            try
            {
                using var doc = JsonDocument.Parse(rawJson);
                var root = doc.RootElement;

                if (root.TryGetProperty("name", out var pName) || root.TryGetProperty("Name", out pName))
                    name = pName.GetString() ?? string.Empty;

                if ((root.TryGetProperty("categoryId", out var pCatId) || root.TryGetProperty("CategoryId", out pCatId)) && pCatId.TryGetInt32(out var cId))
                    categoryId = cId;

                if ((root.TryGetProperty("provinceId", out var pProvId) || root.TryGetProperty("ProvinceId", out pProvId)) && pProvId.TryGetInt32(out var pvId))
                    provinceId = pvId;

                if (root.TryGetProperty("address", out var pAddr) || root.TryGetProperty("Address", out pAddr) || root.TryGetProperty("location", out pAddr))
                    address = pAddr.GetString() ?? string.Empty;

                if (root.TryGetProperty("latitude", out var pLat) || root.TryGetProperty("Latitude", out pLat) || root.TryGetProperty("lat", out pLat))
                {
                    if (pLat.TryGetDecimal(out var dLat)) latitude = dLat;
                }

                if (root.TryGetProperty("longitude", out var pLng) || root.TryGetProperty("Longitude", out pLng) || root.TryGetProperty("lng", out pLng))
                {
                    if (pLng.TryGetDecimal(out var dLng)) longitude = dLng;
                }

                if (root.TryGetProperty("phone", out var pPhone) || root.TryGetProperty("Phone", out pPhone))
                    phone = pPhone.GetString();

                if (root.TryGetProperty("website", out var pWeb) || root.TryGetProperty("Website", out pWeb))
                    website = pWeb.GetString();

                if (root.TryGetProperty("openingHours", out var pOpen) || root.TryGetProperty("OpeningHours", out pOpen) || root.TryGetProperty("hours", out pOpen))
                    openingHours = pOpen.GetString();

                if (root.TryGetProperty("minPrice", out var pMin) || root.TryGetProperty("MinPrice", out pMin))
                {
                    if (pMin.TryGetDecimal(out var dMin)) minPrice = dMin;
                }

                if (root.TryGetProperty("maxPrice", out var pMax) || root.TryGetProperty("MaxPrice", out pMax))
                {
                    if (pMax.TryGetDecimal(out var dMax)) maxPrice = dMax;
                }

                if (root.TryGetProperty("description", out var pDesc) || root.TryGetProperty("Description", out pDesc) || root.TryGetProperty("desc", out pDesc))
                    description = pDesc.GetString();

                if (root.TryGetProperty("coverImg", out var pCover) || root.TryGetProperty("CoverImg", out pCover) || root.TryGetProperty("primaryImageUrl", out pCover) || root.TryGetProperty("img", out pCover))
                    coverImg = pCover.GetString();

                var imgPropNames = new[] { "images", "Images", "photos", "Photos", "mediaUrls", "MediaUrls" };
                foreach (var propName in imgPropNames)
                {
                    if (root.TryGetProperty(propName, out var pImgs) && pImgs.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var elem in pImgs.EnumerateArray())
                        {
                            var u = elem.GetString();
                            if (!string.IsNullOrWhiteSpace(u) && !images.Contains(u))
                            {
                                images.Add(u);
                            }
                        }
                        break;
                    }
                }
            }
            catch
            {
                // Bỏ qua lỗi parse JSON để fallback an toàn
            }
        }

        // Đảm bảo dữ liệu tối thiểu hợp lệ
        if (provinceId <= 0) provinceId = proposal.ProvinceId ?? 1;
        if (categoryId <= 0) categoryId = proposal.CategoryId ?? 1;
        if (string.IsNullOrWhiteSpace(name)) name = "Địa điểm đề xuất";
        if (string.IsNullOrWhiteSpace(address)) address = "Chưa cập nhật";
        if (string.IsNullOrWhiteSpace(coverImg) && images.Count > 0) coverImg = images[0];

        long? effectiveTargetPlaceId = targetPlaceId ?? proposal.TargetPlaceId;

        if (!AdminScopeFilterHelper.ValidatePlaceInputScope(_currentUserService, categoryId, provinceId))
        {
            return false;
        }

        // Trường hợp 1: Cập nhật địa điểm đã có
        if (effectiveTargetPlaceId.HasValue && effectiveTargetPlaceId.Value > 0)
        {
            var existingPlace = await _dbContext.Places
                .Include(p => p.Media)
                .FirstOrDefaultAsync(p => p.Id == effectiveTargetPlaceId.Value, ct);

            if (existingPlace != null)
            {
                existingPlace.UpdateDetails(
                    name: !string.IsNullOrWhiteSpace(name) ? name : existingPlace.Name,
                    address: !string.IsNullOrWhiteSpace(address) ? address : existingPlace.Address,
                    provinceId: provinceId > 0 ? provinceId : existingPlace.ProvinceId,
                    categoryId: categoryId > 0 ? categoryId : existingPlace.CategoryId,
                    description: description ?? existingPlace.Description,
                    phone: phone ?? existingPlace.Phone,
                    website: website ?? existingPlace.Website,
                    openingHours: openingHours ?? existingPlace.OpeningHours,
                    coverImageUrl: !string.IsNullOrWhiteSpace(coverImg) ? coverImg : existingPlace.CoverImageUrl);

                existingPlace.UpdatePriceRange(minPrice ?? existingPlace.MinPrice, maxPrice ?? existingPlace.MaxPrice);
                existingPlace.UpdateCoordinates(latitude ?? existingPlace.Latitude, longitude ?? existingPlace.Longitude);
                existingPlace.Approve(adminId);

                if (images.Count > 0)
                {
                    var existingUrls = new HashSet<string>(existingPlace.Media.Select(m => m.Url), StringComparer.OrdinalIgnoreCase);
                    foreach (var img in images)
                    {
                        if (!string.IsNullOrWhiteSpace(img) && !existingUrls.Contains(img))
                        {
                            existingPlace.AddMedia(img.Trim(), MediaType.Image, isPrimary: false);
                            existingUrls.Add(img);
                        }
                    }
                }
            }
        }
        // Trường hợp 2: Tạo mới địa điểm thật trong hệ thống
        else
        {
            var slug = BlogRepository.GenerateSlug(name);
            var newPlace = new Place(
                provinceId: provinceId,
                categoryId: categoryId,
                name: name,
                address: address,
                createdBy: proposal.UserId,
                description: description,
                minPrice: minPrice,
                maxPrice: maxPrice,
                phone: phone,
                website: website,
                openingHours: openingHours,
                latitude: latitude,
                longitude: longitude,
                slug: slug,
                coverImageUrl: coverImg);

            newPlace.Approve(adminId);
            _dbContext.Places.Add(newPlace);
            await _dbContext.SaveChangesAsync(ct);

            if (images.Count > 0)
            {
                for (int i = 0; i < images.Count; i++)
                {
                    var img = images[i];
                    if (!string.IsNullOrWhiteSpace(img))
                    {
                        newPlace.AddMedia(img.Trim(), MediaType.Image, isPrimary: i == 0);
                    }
                }
                await _dbContext.SaveChangesAsync(ct);
            }

            effectiveTargetPlaceId = newPlace.Id;
        }

        // Cập nhật trạng thái và liên kết Proposal với Place
        proposal.Approve(adminId, adminNote, effectiveTargetPlaceId);
        await _dbContext.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> RejectProposalAsync(long id, long adminId, string reason, CancellationToken ct = default)
    {
        if (!await IsProposalInScopeAsync(id)) return false;

        var proposal = await _dbContext.Proposals.FirstOrDefaultAsync(p => p.Id == id, ct);
        if (proposal == null) return false;

        proposal.Reject(adminId, reason);
        await _dbContext.SaveChangesAsync(ct);
        return true;
    }

    private async Task<bool> IsProposalInScopeAsync(long proposalId)
    {
        if (_currentUserService.IsSystemAdmin) return true;
        var connection = _dbContext.Database.GetDbConnection();
        const string sql = @"
            SELECT COALESCE(p.CategoryId, targetP.CategoryId) AS CategoryId,
                   COALESCE(p.ProvinceId, targetP.ProvinceId) AS ProvinceId,
                   prov.RegionId
            FROM dbo.Proposals p
            LEFT JOIN dbo.Places targetP ON p.TargetPlaceId = targetP.Id
            LEFT JOIN dbo.Provinces prov ON COALESCE(p.ProvinceId, targetP.ProvinceId) = prov.Id
            WHERE p.Id = @Id;";

        var row = await connection.QueryFirstOrDefaultAsync<(int? CategoryId, int? ProvinceId, int? RegionId)?>(sql, new { Id = proposalId });
        if (row == null) return false;

        var catScopes = _currentUserService.CategoryScopes;
        var provScopes = _currentUserService.ProvinceScopes;
        var regScopes = _currentUserService.RegionScopes;

        if (catScopes.Count == 0 && provScopes.Count == 0 && regScopes.Count == 0) return false;

        if (catScopes.Count > 0 && (!row.Value.CategoryId.HasValue || !catScopes.Contains(row.Value.CategoryId.Value)))
            return false;

        if (provScopes.Count > 0 && regScopes.Count > 0)
        {
            if ((!row.Value.ProvinceId.HasValue || !provScopes.Contains(row.Value.ProvinceId.Value)) &&
                (!row.Value.RegionId.HasValue || !regScopes.Contains(row.Value.RegionId.Value)))
                return false;
        }
        else if (provScopes.Count > 0 && (!row.Value.ProvinceId.HasValue || !provScopes.Contains(row.Value.ProvinceId.Value)))
        {
            return false;
        }
        else if (regScopes.Count > 0 && (!row.Value.RegionId.HasValue || !regScopes.Contains(row.Value.RegionId.Value)))
        {
            return false;
        }

        return true;
    }
}
