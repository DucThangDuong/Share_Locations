using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs.Admin;
using Dapper;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class AdminUserRepository : IAdminUserRepository
{
    private readonly TravelReviewDbContext _dbContext;
    private readonly ICurrentUserService _currentUserService;

    public AdminUserRepository(
        TravelReviewDbContext dbContext,
        ICurrentUserService currentUserService)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
    }

    public async Task<PagedResult<AdminUserListItemDto>> GetAdminUsersAsync(
        string? role,
        int? categoryId,
        int? regionId,
        int? provinceId,
        long? placeId,
        int? status,
        string? keyword,
        int page,
        int pageSize,
        CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        var whereClauses = new List<string> { "u.IsDeleted = 0" };
        var parameters = new DynamicParameters();

        // PHÂN QUYỀN ĐẶC BIỆT:
        // - Nếu người gọi là CATEGORY_ADMIN (Admin cấp 1):
        //   -> TUYỆT ĐỐI KHÔNG được lấy tài khoản CATEGORY_ADMIN hay SYSTEM_ADMIN!
        //   -> Cưỡng chế chỉ lấy USER thường.
        // - Nếu người gọi là SYSTEM_ADMIN (Admin tổng):
        //   -> Được lấy toàn bộ: USER, CATEGORY_ADMIN, SYSTEM_ADMIN theo filter.
        if (!_currentUserService.IsSystemAdmin && _currentUserService.IsCategoryAdmin)
        {
            whereClauses.Add(@"EXISTS (
                SELECT 1 FROM dbo.UserRoles ur 
                JOIN dbo.Roles ro ON ur.RoleId = ro.Id 
                WHERE ur.UserId = u.Id AND ro.Code = 'USER'
            ) AND NOT EXISTS (
                SELECT 1 FROM dbo.UserRoles ur 
                JOIN dbo.Roles ro ON ur.RoleId = ro.Id 
                WHERE ur.UserId = u.Id AND ro.Code IN ('CATEGORY_ADMIN', 'SYSTEM_ADMIN')
            )");
        }
        else
        {
            // Lọc theo Role cho System Admin
            if (!string.IsNullOrWhiteSpace(role) && !role.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                var r = role.Trim().ToUpperInvariant();
                if (r == "USER" || r == "NORMAL")
                {
                    whereClauses.Add(@"EXISTS (
                        SELECT 1 FROM dbo.UserRoles ur 
                        JOIN dbo.Roles ro ON ur.RoleId = ro.Id 
                        WHERE ur.UserId = u.Id AND ro.Code = 'USER'
                    ) AND NOT EXISTS (
                        SELECT 1 FROM dbo.UserRoles ur 
                        JOIN dbo.Roles ro ON ur.RoleId = ro.Id 
                        WHERE ur.UserId = u.Id AND ro.Code IN ('CATEGORY_ADMIN', 'SYSTEM_ADMIN')
                    )");
                }
                else if (r == "CATEGORY_ADMIN" || r == "ADMIN1" || r == "STAFF")
                {
                    whereClauses.Add(@"EXISTS (
                        SELECT 1 FROM dbo.UserRoles ur 
                        JOIN dbo.Roles ro ON ur.RoleId = ro.Id 
                        WHERE ur.UserId = u.Id AND ro.Code = 'CATEGORY_ADMIN'
                    )");
                }
                else if (r == "SYSTEM_ADMIN" || r == "ADMIN" || r == "SUPERADMIN")
                {
                    whereClauses.Add(@"EXISTS (
                        SELECT 1 FROM dbo.UserRoles ur 
                        JOIN dbo.Roles ro ON ur.RoleId = ro.Id 
                        WHERE ur.UserId = u.Id AND ro.Code = 'SYSTEM_ADMIN'
                    )");
                }
            }
        }

        // 2. Filter theo Category (dành cho Admin cấp 1 quản trị danh mục này)
        if (categoryId.HasValue && categoryId.Value > 0)
        {
            whereClauses.Add(@"EXISTS (
                SELECT 1 FROM dbo.AdminCategoryScopes acs 
                WHERE acs.UserId = u.Id AND acs.CategoryId = @CategoryId
            )");
            parameters.Add("CategoryId", categoryId.Value);
        }

        // 3. Filter theo Region (dành cho Admin cấp 1 quản trị vùng này)
        if (regionId.HasValue && regionId.Value > 0)
        {
            whereClauses.Add(@"(
                EXISTS (
                    SELECT 1 FROM dbo.AdminRegionScopes ars 
                    WHERE ars.UserId = u.Id AND ars.RegionId = @RegionId
                )
                OR EXISTS (
                    SELECT 1 FROM dbo.AdminProvinceScopes aps 
                    JOIN dbo.Provinces p ON aps.ProvinceId = p.Id 
                    WHERE aps.UserId = u.Id AND p.RegionId = @RegionId
                )
            )");
            parameters.Add("RegionId", regionId.Value);
        }

        // 4. Filter theo Province (dành cho Admin cấp 1 quản trị tỉnh này)
        if (provinceId.HasValue && provinceId.Value > 0)
        {
            whereClauses.Add(@"EXISTS (
                SELECT 1 FROM dbo.AdminProvinceScopes aps 
                WHERE aps.UserId = u.Id AND aps.ProvinceId = @ProvinceId
            )");
            parameters.Add("ProvinceId", provinceId.Value);
        }

        // 5. Filter theo Place (dành cho Admin cấp 1 quản trị địa điểm này)
        if (placeId.HasValue && placeId.Value > 0)
        {
            whereClauses.Add(@"EXISTS (
                SELECT 1 FROM dbo.Places pl 
                WHERE pl.Id = @PlaceId
                  AND EXISTS (
                      SELECT 1 FROM dbo.AdminCategoryScopes acs 
                      WHERE acs.UserId = u.Id AND acs.CategoryId = pl.CategoryId
                  )
                  AND (
                      NOT EXISTS (SELECT 1 FROM dbo.AdminProvinceScopes aps WHERE aps.UserId = u.Id)
                      OR EXISTS (SELECT 1 FROM dbo.AdminProvinceScopes aps WHERE aps.UserId = u.Id AND aps.ProvinceId = pl.ProvinceId)
                  )
                  AND (
                      NOT EXISTS (SELECT 1 FROM dbo.AdminRegionScopes ars WHERE ars.UserId = u.Id)
                      OR EXISTS (
                          SELECT 1 FROM dbo.AdminRegionScopes ars 
                          JOIN dbo.Provinces prov ON ars.RegionId = prov.RegionId 
                          WHERE ars.UserId = u.Id AND prov.Id = pl.ProvinceId
                      )
                  )
            )");
            parameters.Add("PlaceId", placeId.Value);
        }

        // 6. Filter theo Status
        if (status.HasValue)
        {
            whereClauses.Add("u.Status = @Status");
            parameters.Add("Status", status.Value);
        }

        // 7. Filter theo Keyword
        if (!string.IsNullOrWhiteSpace(keyword))
        {
            whereClauses.Add("(u.Email LIKE @Keyword OR prof.FullName LIKE @Keyword OR prof.Phone LIKE @Keyword)");
            parameters.Add("Keyword", $"%{keyword.Trim()}%");
        }

        var whereSql = " WHERE " + string.Join(" AND ", whereClauses);

        // Đếm tổng số
        var countSql = $@"
            SELECT COUNT(1)
            FROM dbo.Users u
            LEFT JOIN dbo.UserProfiles prof ON u.Id = prof.UserId
            {whereSql};";

        var totalCount = await connection.ExecuteScalarAsync<int>(countSql, parameters);

        // Phân trang
        var offset = (page - 1) * pageSize;
        parameters.Add("Offset", offset);
        parameters.Add("PageSize", pageSize);

        var dataSql = $@"
            SELECT 
                u.Id,
                u.Email,
                prof.FullName,
                prof.AvatarUrl,
                prof.Phone AS PhoneNumber,
                u.Status,
                u.CreatedAt,
                u.LastLoginAt
            FROM dbo.Users u
            LEFT JOIN dbo.UserProfiles prof ON u.Id = prof.UserId
            {whereSql}
            ORDER BY u.CreatedAt DESC
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;";

        var items = (await connection.QueryAsync<AdminUserListItemDto>(dataSql, parameters)).ToList();

        if (items.Count > 0)
        {
            var userIds = items.Select(x => x.Id).ToList();

            // Lấy vai trò (Roles)
            const string rolesSql = @"
                SELECT ur.UserId, r.Code AS RoleCode 
                FROM dbo.UserRoles ur 
                JOIN dbo.Roles r ON ur.RoleId = r.Id 
                WHERE ur.UserId IN @UserIds AND r.IsActive = 1
                  AND (ur.ExpiresAt IS NULL OR ur.ExpiresAt > SYSUTCDATETIME());";

            var roleRows = await connection.QueryAsync<(long UserId, string RoleCode)>(rolesSql, new { UserIds = userIds });
            var roleLookup = roleRows.ToLookup(x => x.UserId, x => x.RoleCode);

            // Lấy phạm vi Danh mục (Category Scopes)
            const string catScopesSql = @"
                SELECT acs.UserId, c.Id AS CategoryId, c.Name AS CategoryName
                FROM dbo.AdminCategoryScopes acs
                JOIN dbo.Categories c ON acs.CategoryId = c.Id
                WHERE acs.UserId IN @UserIds
                ORDER BY c.DisplayOrder, c.Name;";

            var catRows = await connection.QueryAsync<(long UserId, int CategoryId, string CategoryName)>(catScopesSql, new { UserIds = userIds });
            var catLookup = catRows.ToLookup(x => x.UserId, x => new AdminScopeCategoryDto { CategoryId = x.CategoryId, CategoryName = x.CategoryName });

            // Lấy phạm vi Tỉnh/Thành (Province Scopes)
            const string provScopesSql = @"
                SELECT aps.UserId, p.Id AS ProvinceId, p.Name AS ProvinceName
                FROM dbo.AdminProvinceScopes aps
                JOIN dbo.Provinces p ON aps.ProvinceId = p.Id
                WHERE aps.UserId IN @UserIds
                ORDER BY p.Name;";

            var provRows = await connection.QueryAsync<(long UserId, int ProvinceId, string ProvinceName)>(provScopesSql, new { UserIds = userIds });
            var provLookup = provRows.ToLookup(x => x.UserId, x => new AdminScopeProvinceDto { ProvinceId = x.ProvinceId, ProvinceName = x.ProvinceName });

            // Lấy phạm vi Vùng/Miền (Region Scopes)
            const string regScopesSql = @"
                SELECT ars.UserId, r.Id AS RegionId, r.Name AS RegionName
                FROM dbo.AdminRegionScopes ars
                JOIN dbo.Regions r ON ars.RegionId = r.Id
                WHERE ars.UserId IN @UserIds
                ORDER BY r.Name;";

            var regRows = await connection.QueryAsync<(long UserId, int RegionId, string RegionName)>(regScopesSql, new { UserIds = userIds });
            var regLookup = regRows.ToLookup(x => x.UserId, x => new AdminScopeRegionDto { RegionId = x.RegionId, RegionName = x.RegionName });

            foreach (var item in items)
            {
                if (roleLookup.Contains(item.Id))
                {
                    item.Roles = roleLookup[item.Id].ToList();
                }

                if (catLookup.Contains(item.Id))
                {
                    item.CategoryScopes = catLookup[item.Id].ToList();
                }

                if (provLookup.Contains(item.Id))
                {
                    item.ProvinceScopes = provLookup[item.Id].ToList();
                }

                if (regLookup.Contains(item.Id))
                {
                    item.RegionScopes = regLookup[item.Id].ToList();
                }
            }
        }

        // Đếm số lượng Admin cấp 1, Admin hệ thống, và User thường trên toàn hệ thống
        int categoryAdminsCount = 0;
        int systemAdminsCount = 0;
        int regularUsersCount = 0;

        if (_currentUserService.IsSystemAdmin)
        {
            const string statsCountSql = @"
                SELECT 
                    (
                        SELECT COUNT(DISTINCT ur.UserId) 
                        FROM dbo.UserRoles ur 
                        JOIN dbo.Roles r ON ur.RoleId = r.Id 
                        JOIN dbo.Users u ON ur.UserId = u.Id
                        WHERE r.Code = 'CATEGORY_ADMIN' AND u.IsDeleted = 0
                    ) AS CategoryAdminsCount,
                    (
                        SELECT COUNT(DISTINCT ur.UserId) 
                        FROM dbo.UserRoles ur 
                        JOIN dbo.Roles r ON ur.RoleId = r.Id 
                        JOIN dbo.Users u ON ur.UserId = u.Id
                        WHERE r.Code = 'SYSTEM_ADMIN' AND u.IsDeleted = 0
                    ) AS SystemAdminsCount,
                    (
                        SELECT COUNT(DISTINCT ur.UserId) 
                        FROM dbo.UserRoles ur 
                        JOIN dbo.Roles r ON ur.RoleId = r.Id 
                        JOIN dbo.Users u ON ur.UserId = u.Id
                        WHERE r.Code = 'USER' AND u.IsDeleted = 0
                          AND NOT EXISTS (
                              SELECT 1 FROM dbo.UserRoles ur2 
                              JOIN dbo.Roles r2 ON ur2.RoleId = r2.Id 
                              WHERE ur2.UserId = ur.UserId AND r2.Code IN ('CATEGORY_ADMIN', 'SYSTEM_ADMIN')
                          )
                    ) AS RegularUsersCount;";

            var counts = await connection.QueryFirstOrDefaultAsync<(int CategoryAdminsCount, int SystemAdminsCount, int RegularUsersCount)>(statsCountSql);
            categoryAdminsCount = counts.CategoryAdminsCount;
            systemAdminsCount = counts.SystemAdminsCount;
            regularUsersCount = counts.RegularUsersCount;
        }
        else
        {
            regularUsersCount = totalCount;
        }

        foreach (var item in items)
        {
            item.CategoryAdminsCount = categoryAdminsCount;
            item.SystemAdminsCount = systemAdminsCount;
            item.RegularUsersCount = regularUsersCount;
        }

        return new PagedResult<AdminUserListItemDto>(
            items,
            totalCount,
            page,
            pageSize,
            categoryAdminsCount,
            systemAdminsCount,
            regularUsersCount);
    }

    public async Task<AdminUserDetailDto?> GetUserDetailByIdAsync(
        long targetUserId,
        CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        const string userSql = @"
            SELECT 
                u.Id,
                u.Email,
                prof.FullName,
                prof.Phone AS PhoneNumber,
                prof.AvatarUrl,
                prof.CoverUrl,
                prof.Bio,
                u.Status,
                ISNULL(prof.RankLevel, N'Tân binh') AS RankLevel,
                ISNULL(prof.ReputationScore, 0) AS ReputationScore,
                u.CreatedAt,
                u.LastLoginAt
            FROM dbo.Users u
            LEFT JOIN dbo.UserProfiles prof ON u.Id = prof.UserId
            WHERE u.Id = @UserId AND u.IsDeleted = 0;";

        var user = await connection.QueryFirstOrDefaultAsync<AdminUserDetailDto>(userSql, new { UserId = targetUserId });
        if (user == null) return null;

        // Roles
        const string rolesSql = @"
            SELECT r.Code 
            FROM dbo.UserRoles ur 
            JOIN dbo.Roles r ON ur.RoleId = r.Id 
            WHERE ur.UserId = @UserId AND r.IsActive = 1
              AND (ur.ExpiresAt IS NULL OR ur.ExpiresAt > SYSUTCDATETIME());";

        var roles = (await connection.QueryAsync<string>(rolesSql, new { UserId = targetUserId })).ToList();
        user.Roles = roles;

        var isCategoryAdmin = roles.Any(r => r.Equals("CATEGORY_ADMIN", StringComparison.OrdinalIgnoreCase));
        var isSystemAdmin = roles.Any(r => r.Equals("SYSTEM_ADMIN", StringComparison.OrdinalIgnoreCase));

        // Nếu là Admin cấp 1 hoặc System Admin -> nạp Scopes & Statistics
        if (isCategoryAdmin || isSystemAdmin)
        {
            // Category Scopes
            const string catScopesSql = @"
                SELECT c.Id AS CategoryId, c.Name AS CategoryName
                FROM dbo.AdminCategoryScopes acs
                JOIN dbo.Categories c ON acs.CategoryId = c.Id
                WHERE acs.UserId = @UserId
                ORDER BY c.DisplayOrder, c.Name;";

            user.CategoryScopes = (await connection.QueryAsync<AdminScopeCategoryDto>(catScopesSql, new { UserId = targetUserId })).ToList();

            // Province Scopes
            const string provScopesSql = @"
                SELECT p.Id AS ProvinceId, p.Name AS ProvinceName
                FROM dbo.AdminProvinceScopes aps
                JOIN dbo.Provinces p ON aps.ProvinceId = p.Id
                WHERE aps.UserId = @UserId
                ORDER BY p.Name;";

            user.ProvinceScopes = (await connection.QueryAsync<AdminScopeProvinceDto>(provScopesSql, new { UserId = targetUserId })).ToList();

            // Region Scopes
            const string regScopesSql = @"
                SELECT r.Id AS RegionId, r.Name AS RegionName
                FROM dbo.AdminRegionScopes ars
                JOIN dbo.Regions r ON ars.RegionId = r.Id
                WHERE ars.UserId = @UserId
                ORDER BY r.Name;";

            user.RegionScopes = (await connection.QueryAsync<AdminScopeRegionDto>(regScopesSql, new { UserId = targetUserId })).ToList();

            // Thống kê hoạt động của Admin
            const string statsSql = @"
                SELECT 
                    (SELECT COUNT(1) FROM dbo.Proposals WHERE ReviewedBy = @UserId AND Status = 1) AS TotalApprovedPlaces,
                    (SELECT COUNT(1) FROM dbo.AdminActionLogs WHERE AdminId = @UserId AND TargetTable = 'Reviews') AS TotalModeratedReviews,
                    (
                        (SELECT COUNT(1) FROM dbo.PlaceReports WHERE ResolvedBy = @UserId) +
                        (SELECT COUNT(1) FROM dbo.ReviewReports WHERE ResolvedBy = @UserId) +
                        (SELECT COUNT(1) FROM dbo.CommentReports WHERE ResolvedBy = @UserId) +
                        (SELECT COUNT(1) FROM dbo.BlogReports WHERE ResolvedBy = @UserId)
                    ) AS TotalHandledReports;";

            user.Statistics = await connection.QueryFirstOrDefaultAsync<AdminStatisticsDto>(statsSql, new { UserId = targetUserId }) 
                              ?? new AdminStatisticsDto();
        }

        return user;
    }

    public async Task<UpdateAdminScopesResponseDto> UpdateUserScopesAsync(
        long targetUserId,
        List<int> categoryIds,
        List<int> provinceIds,
        List<int>? regionIds,
        long updatedBy,
        CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();
        if (connection.State != System.Data.ConnectionState.Open)
        {
            await connection.OpenAsync(ct);
        }

        using var transaction = connection.BeginTransaction();

        try
        {
            // 1. Cập nhật Category Scopes
            await connection.ExecuteAsync(
                "DELETE FROM dbo.AdminCategoryScopes WHERE UserId = @UserId;",
                new { UserId = targetUserId },
                transaction);

            if (categoryIds != null && categoryIds.Count > 0)
            {
                const string insertCatSql = @"
                    INSERT INTO dbo.AdminCategoryScopes (UserId, CategoryId, AssignedBy, AssignedAt)
                    VALUES (@UserId, @CategoryId, @AssignedBy, SYSUTCDATETIME());";

                var catParams = categoryIds.Distinct().Select(id => new
                {
                    UserId = targetUserId,
                    CategoryId = id,
                    AssignedBy = updatedBy
                });

                await connection.ExecuteAsync(insertCatSql, catParams, transaction);
            }

            // 2. Cập nhật Province Scopes
            await connection.ExecuteAsync(
                "DELETE FROM dbo.AdminProvinceScopes WHERE UserId = @UserId;",
                new { UserId = targetUserId },
                transaction);

            if (provinceIds != null && provinceIds.Count > 0)
            {
                const string insertProvSql = @"
                    INSERT INTO dbo.AdminProvinceScopes (UserId, ProvinceId, AssignedBy, AssignedAt)
                    VALUES (@UserId, @ProvinceId, @AssignedBy, SYSUTCDATETIME());";

                var provParams = provinceIds.Distinct().Select(id => new
                {
                    UserId = targetUserId,
                    ProvinceId = id,
                    AssignedBy = updatedBy
                });

                await connection.ExecuteAsync(insertProvSql, provParams, transaction);
            }

            // 3. Cập nhật Region Scopes (nếu có truyền)
            if (regionIds != null)
            {
                await connection.ExecuteAsync(
                    "DELETE FROM dbo.AdminRegionScopes WHERE UserId = @UserId;",
                    new { UserId = targetUserId },
                    transaction);

                if (regionIds.Count > 0)
                {
                    const string insertRegSql = @"
                        INSERT INTO dbo.AdminRegionScopes (UserId, RegionId, AssignedBy, AssignedAt)
                        VALUES (@UserId, @RegionId, @AssignedBy, SYSUTCDATETIME());";

                    var regParams = regionIds.Distinct().Select(id => new
                    {
                        UserId = targetUserId,
                        RegionId = id,
                        AssignedBy = updatedBy
                    });

                    await connection.ExecuteAsync(insertRegSql, regParams, transaction);
                }
            }

            // 4. Ghi Audit Log vào AdminActionLogs
            const string logSql = @"
                INSERT INTO dbo.AdminActionLogs (
                    AdminId, ActionType, TargetTable, TargetId, ActionStatus, Reason, CreatedAt
                ) VALUES (
                    @AdminId, 'ASSIGN_SCOPES', 'Users', @TargetId, 1, @Reason, SYSUTCDATETIME()
                );";

            await connection.ExecuteAsync(logSql, new
            {
                AdminId = updatedBy,
                TargetId = targetUserId,
                Reason = $"Cập nhật phân quyền: {categoryIds?.Count ?? 0} danh mục, {provinceIds?.Count ?? 0} tỉnh thành."
            }, transaction);

            transaction.Commit();

            return new UpdateAdminScopesResponseDto
            {
                UserId = targetUserId,
                UpdatedCategoryCount = categoryIds?.Distinct().Count() ?? 0,
                UpdatedProvinceCount = provinceIds?.Distinct().Count() ?? 0,
                UpdatedRegionCount = regionIds?.Distinct().Count() ?? 0
            };
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }

    public async Task<bool> UpdateUserStatusAsync(
        long targetUserId,
        byte status,
        string? reason,
        long updatedBy,
        CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        const string updateSql = @"
            UPDATE dbo.Users 
            SET Status = @Status, UpdatedAt = SYSUTCDATETIME() 
            WHERE Id = @UserId AND IsDeleted = 0;";

        var rows = await connection.ExecuteAsync(updateSql, new { UserId = targetUserId, Status = status });
        if (rows > 0)
        {
            const string logSql = @"
                INSERT INTO dbo.AdminActionLogs (
                    AdminId, ActionType, TargetTable, TargetId, ActionStatus, Reason, CreatedAt
                ) VALUES (
                    @AdminId, @ActionType, 'Users', @TargetId, 1, @Reason, SYSUTCDATETIME()
                );";

            var actionType = status == 1 ? "ACTIVATE_USER" : "LOCK_USER";
            await connection.ExecuteAsync(logSql, new
            {
                AdminId = updatedBy,
                ActionType = actionType,
                TargetId = targetUserId,
                Reason = reason ?? (status == 1 ? "Mở khóa tài khoản" : "Khóa tài khoản")
            });

            return true;
        }

        return false;
    }

    public async Task<UserActivitiesDto> GetUserActivitiesAsync(
        long targetUserId,
        CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();
        var result = new UserActivitiesDto();

        // 1. Reviews (Top 20)
        const string reviewsSql = @"
            SELECT TOP 20
                r.Id,
                r.PlaceId,
                ISNULL(p.Name, N'Địa điểm') AS PlaceName,
                c.Name AS Category,
                prov.Name AS Province,
                r.Rating,
                r.Content,
                r.CreatedAt,
                ISNULL(r.LikesCount, 0) AS Likes,
                CASE r.Status WHEN 1 THEN 'active' ELSE 'hidden' END AS Status
            FROM dbo.Reviews r
            LEFT JOIN dbo.Places p ON r.PlaceId = p.Id
            LEFT JOIN dbo.Categories c ON p.CategoryId = c.Id
            LEFT JOIN dbo.Provinces prov ON p.ProvinceId = prov.Id
            WHERE r.UserId = @UserId
            ORDER BY r.CreatedAt DESC;";

        result.Reviews = (await connection.QueryAsync<UserReviewActivityDto>(reviewsSql, new { UserId = targetUserId })).ToList();

        // 2. Blogs (Top 20)
        const string blogsSql = @"
            SELECT TOP 20
                b.Id,
                b.Title,
                c.Name AS Category,
                ISNULL(b.ViewCount, 0) AS Views,
                ISNULL(b.LikeCount, 0) AS Likes,
                b.PublishedAt,
                CASE b.Status WHEN 1 THEN 'published' ELSE 'draft' END AS Status
            FROM dbo.Blogs b
            LEFT JOIN dbo.Categories c ON b.CategoryId = c.Id
            WHERE b.AuthorId = @UserId
            ORDER BY b.CreatedAt DESC;";

        result.Blogs = (await connection.QueryAsync<UserBlogActivityDto>(blogsSql, new { UserId = targetUserId })).ToList();

        // 3. Trips (Top 20)
        const string tripsSql = @"
            SELECT TOP 20
                t.Id,
                t.Title,
                CASE 
                    WHEN t.StartDate IS NOT NULL AND t.EndDate IS NOT NULL 
                    THEN CAST(DATEDIFF(day, t.StartDate, t.EndDate) + 1 AS NVARCHAR) + N' ngày'
                    ELSE N'Chưa đặt lịch'
                END AS Duration,
                (
                    SELECT COUNT(1) 
                    FROM dbo.TripDays td 
                    JOIN dbo.TripPlaces tp ON tp.TripDayId = td.Id 
                    WHERE td.TripId = t.Id
                ) AS PlacesCount,
                t.CreatedAt,
                CASE t.Privacy WHEN 1 THEN 'public' ELSE 'private' END AS Status
            FROM dbo.Trips t
            WHERE t.UserId = @UserId
            ORDER BY t.CreatedAt DESC;";

        result.Trips = (await connection.QueryAsync<UserTripActivityDto>(tripsSql, new { UserId = targetUserId })).ToList();

        // 4. Proposals (Top 20)
        const string proposalsSql = @"
            SELECT TOP 20
                pr.Id,
                ISNULL(
                    p.Name, 
                    ISNULL(JSON_VALUE(pr.ProposedDataJSON, '$.Name'), N'Đề xuất địa điểm mới')
                ) AS PlaceName,
                c.Name AS Category,
                prov.Name AS Province,
                pr.CreatedAt AS SubmittedAt,
                pr.Status
            FROM dbo.Proposals pr
            LEFT JOIN dbo.Places p ON pr.TargetPlaceId = p.Id
            LEFT JOIN dbo.Categories c ON pr.CategoryId = c.Id
            LEFT JOIN dbo.Provinces prov ON pr.ProvinceId = prov.Id
            WHERE pr.UserId = @UserId
            ORDER BY pr.CreatedAt DESC;";

        result.Proposals = (await connection.QueryAsync<UserProposalActivityDto>(proposalsSql, new { UserId = targetUserId })).ToList();

        return result;
    }

    public async Task<AdminAccessHistoryResultDto> GetAdminAccessHistoryAsync(
        long targetAdminId,
        int page,
        int pageSize,
        CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        const string countSql = @"
            SELECT COUNT(1) 
            FROM dbo.AdminActionLogs 
            WHERE AdminId = @AdminId;";

        var total = await connection.ExecuteScalarAsync<int>(countSql, new { AdminId = targetAdminId });

        var offset = (page - 1) * pageSize;
        const string dataSql = @"
            SELECT 
                CAST(l.Id AS NVARCHAR) AS LogId,
                l.ActionType AS Action,
                l.TargetTable AS TargetType,
                l.TargetId,
                l.Reason AS TargetName,
                l.CreatedAt AS Timestamp,
                CASE l.ActionStatus WHEN 1 THEN N'Thành công' ELSE N'Thất bại' END AS Result,
                l.IpAddress
            FROM dbo.AdminActionLogs l
            WHERE l.AdminId = @AdminId
            ORDER BY l.CreatedAt DESC
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;";

        var items = (await connection.QueryAsync<AdminAccessHistoryItemDto>(dataSql, new
        {
            AdminId = targetAdminId,
            Offset = offset,
            PageSize = pageSize
        })).ToList();

        return new AdminAccessHistoryResultDto
        {
            Items = items,
            Total = total
        };
    }
}
