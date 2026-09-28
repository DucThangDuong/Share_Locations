using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs.Admin;
using Dapper;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class AdminProposalRepository : IAdminProposalRepository
{
    private readonly TravelReviewDbContext _dbContext;
    private readonly ICurrentUserService _currentUserService;

    public AdminProposalRepository(TravelReviewDbContext dbContext, ICurrentUserService currentUserService)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
    }

    public async Task<PagedResult<AdminProposalDto>> GetProposalsAsync(
        int? status,
        string? keyword,
        int page,
        int pageSize,
        CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        var whereClauses = new List<string>();
        var parameters = new DynamicParameters();

        // Áp dụng giới hạn phân quyền theo Scope của Admin cấp 1
        if (!_currentUserService.IsSystemAdmin)
        {
            var catScopes = _currentUserService.CategoryScopes;
            var provScopes = _currentUserService.ProvinceScopes;
            var regScopes = _currentUserService.RegionScopes;

            if (catScopes.Count == 0 && provScopes.Count == 0 && regScopes.Count == 0)
            {
                whereClauses.Add("1 = 0");
            }
            else
            {
                if (catScopes.Count > 0)
                {
                    whereClauses.Add("COALESCE(p.CategoryId, targetP.CategoryId) IN @ScopeCategoryIds");
                    parameters.Add("ScopeCategoryIds", catScopes);
                }

                if (provScopes.Count > 0 && regScopes.Count > 0)
                {
                    whereClauses.Add("(COALESCE(p.ProvinceId, targetP.ProvinceId) IN @ScopeProvinceIds OR prov.RegionId IN @ScopeRegionIds)");
                    parameters.Add("ScopeProvinceIds", provScopes);
                    parameters.Add("ScopeRegionIds", regScopes);
                }
                else if (provScopes.Count > 0)
                {
                    whereClauses.Add("COALESCE(p.ProvinceId, targetP.ProvinceId) IN @ScopeProvinceIds");
                    parameters.Add("ScopeProvinceIds", provScopes);
                }
                else if (regScopes.Count > 0)
                {
                    whereClauses.Add("prov.RegionId IN @ScopeRegionIds");
                    parameters.Add("ScopeRegionIds", regScopes);
                }
            }
        }

        if (status.HasValue)
        {
            whereClauses.Add("p.Status = @Status");
            parameters.Add("Status", status.Value);
        }

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            whereClauses.Add("(COALESCE(prof.FullName, u.Email) LIKE @Keyword OR targetP.Name LIKE @Keyword)");
            parameters.Add("Keyword", $"%{keyword.Trim()}%");
        }

        var whereSql = whereClauses.Count > 0 ? " WHERE " + string.Join(" AND ", whereClauses) : "";

        var countSql = $@"
            SELECT COUNT(1)
            FROM dbo.Proposals p
            LEFT JOIN dbo.Users u ON p.UserId = u.Id
            LEFT JOIN dbo.UserProfiles prof ON u.Id = prof.UserId
            LEFT JOIN dbo.Places targetP ON p.TargetPlaceId = targetP.Id
            LEFT JOIN dbo.Provinces prov ON COALESCE(p.ProvinceId, targetP.ProvinceId) = prov.Id
            {whereSql};";

        var totalCount = await connection.ExecuteScalarAsync<int>(countSql, parameters);

        var offset = (page - 1) * pageSize;
        parameters.Add("Offset", offset);
        parameters.Add("PageSize", pageSize);

        var querySql = $@"
            SELECT 
                p.Id,
                CASE WHEN p.TargetPlaceId IS NULL THEN 'new_place' ELSE 'update_info' END AS Type,
                COALESCE(targetP.Name, N'Đề xuất địa điểm mới') AS PlaceName,
                p.UserId,
                COALESCE(prof.FullName, u.Email, N'Người dùng') AS ProposedBy,
                prof.AvatarUrl AS UserAvatar,
                cat.Name AS Category,
                prov.Name AS Province,
                p.CreatedAt AS SubmittedAt,
                CAST(p.Status AS INT) AS Status,
                p.TargetPlaceId,
                targetP.Name AS TargetPlaceName,
                p.ProposedDataJSON AS ProposedDataJson,
                p.RejectReason AS RejectionReason
            FROM dbo.Proposals p
            LEFT JOIN dbo.Users u ON p.UserId = u.Id
            LEFT JOIN dbo.UserProfiles prof ON u.Id = prof.UserId
            LEFT JOIN dbo.Places targetP ON p.TargetPlaceId = targetP.Id
            LEFT JOIN dbo.Categories cat ON COALESCE(p.CategoryId, targetP.CategoryId) = cat.Id
            LEFT JOIN dbo.Provinces prov ON COALESCE(p.ProvinceId, targetP.ProvinceId) = prov.Id
            {whereSql}
            ORDER BY p.CreatedAt DESC
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;";

        var items = (await connection.QueryAsync<AdminProposalDto>(querySql, parameters)).ToList();
        return new PagedResult<AdminProposalDto>(items, totalCount, page, pageSize);
    }

    public async Task<AdminProposalDto?> GetProposalDetailAsync(long id, CancellationToken ct = default)
    {
        if (!await IsProposalInScopeAsync(id)) return null;

        var connection = _dbContext.Database.GetDbConnection();

        const string sql = @"
            SELECT 
                p.Id,
                CASE WHEN p.TargetPlaceId IS NULL THEN 'new_place' ELSE 'update_info' END AS Type,
                COALESCE(targetP.Name, N'Đề xuất địa điểm mới') AS PlaceName,
                p.UserId,
                COALESCE(prof.FullName, u.Email, N'Người dùng') AS ProposedBy,
                prof.AvatarUrl AS UserAvatar,
                cat.Name AS Category,
                prov.Name AS Province,
                p.CreatedAt AS SubmittedAt,
                CAST(p.Status AS INT) AS Status,
                p.TargetPlaceId,
                targetP.Name AS TargetPlaceName,
                p.ProposedDataJSON AS ProposedDataJson,
                p.RejectReason AS RejectionReason
            FROM dbo.Proposals p
            LEFT JOIN dbo.Users u ON p.UserId = u.Id
            LEFT JOIN dbo.UserProfiles prof ON u.Id = prof.UserId
            LEFT JOIN dbo.Places targetP ON p.TargetPlaceId = targetP.Id
            LEFT JOIN dbo.Categories cat ON COALESCE(p.CategoryId, targetP.CategoryId) = cat.Id
            LEFT JOIN dbo.Provinces prov ON COALESCE(p.ProvinceId, targetP.ProvinceId) = prov.Id
            WHERE p.Id = @Id;";

        return await connection.QueryFirstOrDefaultAsync<AdminProposalDto>(sql, new { Id = id });
    }

    public async Task<bool> ApproveProposalAsync(long id, long adminId, long? targetPlaceId, CancellationToken ct = default)
    {
        if (!await IsProposalInScopeAsync(id)) return false;

        var proposal = await _dbContext.Proposals.FirstOrDefaultAsync(p => p.Id == id, ct);
        if (proposal == null) return false;

        proposal.Approve(adminId);
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
