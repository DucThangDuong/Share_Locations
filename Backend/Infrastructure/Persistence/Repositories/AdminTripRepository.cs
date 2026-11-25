using System.Data;
using System.Globalization;
using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs.Admin;
using Dapper;
using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class AdminTripRepository : IAdminTripRepository
{
    private readonly TravelReviewDbContext _dbContext;
    private readonly ICurrentUserService _currentUserService;
    private readonly IAuditLogService _auditLogService;

    private sealed class RawAdminTripRow
    {
        public long Id { get; set; }
        public long UserId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Slug { get; set; }
        public string? Description { get; set; }
        public string? CoverImageUrl { get; set; }
        public string AuthorName { get; set; } = string.Empty;
        public string? AuthorAvatar { get; set; }
        public string? AuthorEmail { get; set; }
        public int? ProvinceId { get; set; }
        public string? ProvinceName { get; set; }
        public int DaysCount { get; set; }
        public int StopsCount { get; set; }
        public int MembersCount { get; set; }
        public decimal? EstimatedBudget { get; set; }
        public byte Privacy { get; set; }
        public byte Status { get; set; }
        public int ViewCount { get; set; }
        public int CloneCount { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    private sealed class RawAdminTripDayRow
    {
        public long Id { get; set; }
        public int DayNumber { get; set; }
        public string? DayTitle { get; set; }
        public DateTime? Date { get; set; }
    }

    private sealed class RawAdminTripStopRow
    {
        public long Id { get; set; }
        public long TripDayId { get; set; }
        public long PlaceId { get; set; }
        public string PlaceName { get; set; } = string.Empty;
        public string? CategoryName { get; set; }
        public string? ProvinceName { get; set; }
        public string? Address { get; set; }
        public string? CoverImageUrl { get; set; }
        public int VisitOrder { get; set; }
        public TimeSpan? StartTime { get; set; }
        public TimeSpan? EndTime { get; set; }
        public decimal? EstimatedCost { get; set; }
        public string? TransportMode { get; set; }
        public string? Note { get; set; }
    }

    private sealed class RawAdminTripMemberRow
    {
        public long UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? AvatarUrl { get; set; }
        public byte Role { get; set; }
        public DateTime JoinedAt { get; set; }
    }

    public AdminTripRepository(
        TravelReviewDbContext dbContext,
        ICurrentUserService currentUserService,
        IAuditLogService auditLogService)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
        _auditLogService = auditLogService;
    }

    public async Task<PagedResult<AdminTripListItemDto>> GetAdminTripsAsync(
        int? provinceId,
        byte? privacy,
        byte? status,
        string? keyword,
        int page,
        int pageSize,
        string? sortBy = null,
        string? sortOrder = null,
        CancellationToken ct = default)
    {
        var normalizedPage = Math.Max(1, page);
        var normalizedPageSize = Math.Clamp(pageSize, 1, 100);

        var whereClauses = new List<string>();
        var parameters = new DynamicParameters();

        AdminScopeFilterHelper.ApplyTripScope(_currentUserService, whereClauses, parameters, "t");

        if (provinceId.HasValue && provinceId.Value > 0)
        {
            whereClauses.Add(@"(
                SELECT TOP 1 pl.ProvinceId
                FROM dbo.TripDays td
                INNER JOIN dbo.TripPlaces tp ON td.Id = tp.TripDayId
                INNER JOIN dbo.Places pl ON tp.PlaceId = pl.Id
                WHERE td.TripId = t.Id AND pl.IsDeleted = 0
                GROUP BY pl.ProvinceId
                ORDER BY COUNT(1) DESC, pl.ProvinceId ASC
            ) = @ProvinceId");
            parameters.Add("ProvinceId", provinceId.Value);
        }

        if (privacy.HasValue)
        {
            if (privacy.Value == (byte)TripPrivacy.Public || privacy.Value == (byte)TripPrivacy.Private)
            {
                whereClauses.Add("t.Privacy = @Privacy");
                parameters.Add("Privacy", privacy.Value);
            }
            else
            {
                whereClauses.Add("1 = 0");
            }
        }
        else
        {
            whereClauses.Add("t.Privacy IN (0, 2)");
        }

        if (status.HasValue)
        {
            whereClauses.Add("t.Status = @Status");
            parameters.Add("Status", status.Value);
        }

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            whereClauses.Add("(t.Title LIKE @Keyword OR t.Description LIKE @Keyword OR COALESCE(prof.FullName, u.Email) LIKE @Keyword)");
            parameters.Add("Keyword", $"%{keyword.Trim()}%");
        }

        var whereSql = whereClauses.Count > 0 ? " WHERE " + string.Join(" AND ", whereClauses) : string.Empty;
        var offset = (normalizedPage - 1) * normalizedPageSize;
        parameters.Add("Offset", offset);
        parameters.Add("PageSize", normalizedPageSize);

        var sortColumn = (sortBy?.Trim().ToLowerInvariant()) switch
        {
            "title" => "t.Title",
            "views" or "viewcount" => "t.ViewCount",
            "clones" or "clonecount" => "t.CloneCount",
            "dayscount" => "(SELECT COUNT(1) FROM dbo.TripDays td WHERE td.TripId = t.Id)",
            "budget" or "estimatedbudget" => "COALESCE(NULLIF(t.EstimatedBudget, 0), (SELECT SUM(tp.EstimatedCost) FROM dbo.TripDays td INNER JOIN dbo.TripPlaces tp ON td.Id = tp.TripDayId WHERE td.TripId = t.Id), 0)",
            "updatedat" => "t.UpdatedAt",
            "startdate" => "t.StartDate",
            _ => "t.CreatedAt"
        };
        var sortDirection = string.Equals(sortOrder, "asc", StringComparison.OrdinalIgnoreCase) ? "ASC" : "DESC";
        var orderSql = $"ORDER BY {sortColumn} {sortDirection}, t.Id {sortDirection}";

        var combinedSql = $@"
        SELECT COUNT(1)
        FROM dbo.Trips t
        LEFT JOIN dbo.Users u ON t.UserId = u.Id
        LEFT JOIN dbo.UserProfiles prof ON u.Id = prof.UserId
        {whereSql};

        SELECT
            t.Id,
            t.UserId,
            t.Title,
            t.Slug,
            t.Description,
            t.CoverImageUrl,
            COALESCE(NULLIF(LTRIM(RTRIM(prof.FullName)), ''), u.Email, N'Người dùng') AS AuthorName,
            prof.AvatarUrl AS AuthorAvatar,
            u.Email AS AuthorEmail,
            prim.ProvinceId,
            prim.ProvinceName,
            (SELECT COUNT(1) FROM dbo.TripDays td WHERE td.TripId = t.Id) AS DaysCount,
            (SELECT COUNT(1)
             FROM dbo.TripDays td
             INNER JOIN dbo.TripPlaces tp ON td.Id = tp.TripDayId
             INNER JOIN dbo.Places pl ON tp.PlaceId = pl.Id
             WHERE td.TripId = t.Id AND pl.IsDeleted = 0) AS StopsCount,
            CASE
                WHEN EXISTS (SELECT 1 FROM dbo.TripMembers tm WHERE tm.TripId = t.Id AND tm.UserId = t.UserId)
                    THEN (SELECT COUNT(1) FROM dbo.TripMembers tm WHERE tm.TripId = t.Id)
                ELSE (SELECT COUNT(1) FROM dbo.TripMembers tm WHERE tm.TripId = t.Id) + 1
            END AS MembersCount,
            COALESCE(NULLIF(t.EstimatedBudget, 0), (SELECT SUM(tp.EstimatedCost) FROM dbo.TripDays td INNER JOIN dbo.TripPlaces tp ON td.Id = tp.TripDayId WHERE td.TripId = t.Id)) AS EstimatedBudget,
            t.Privacy,
            t.Status,
            t.ViewCount,
            t.CloneCount,
            t.StartDate,
            t.EndDate,
            t.CreatedAt,
            t.UpdatedAt
        FROM dbo.Trips t
        LEFT JOIN dbo.Users u ON t.UserId = u.Id
        LEFT JOIN dbo.UserProfiles prof ON u.Id = prof.UserId
        OUTER APPLY (
            SELECT TOP 1 pl.ProvinceId, pr.Name AS ProvinceName
            FROM dbo.TripDays td
            INNER JOIN dbo.TripPlaces tp ON td.Id = tp.TripDayId
            INNER JOIN dbo.Places pl ON tp.PlaceId = pl.Id
            INNER JOIN dbo.Provinces pr ON pl.ProvinceId = pr.Id
            WHERE td.TripId = t.Id AND pl.IsDeleted = 0
            GROUP BY pl.ProvinceId, pr.Name
            ORDER BY COUNT(1) DESC, pl.ProvinceId ASC
        ) prim
        {whereSql}
        {orderSql}
        OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;";

        var strategy = _dbContext.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            var connection = _dbContext.Database.GetDbConnection();
            var wasClosed = connection.State == ConnectionState.Closed;
            if (wasClosed)
            {
                await connection.OpenAsync(ct);
            }

            try
            {
                var command = new CommandDefinition(combinedSql, parameters, cancellationToken: ct);
                using var multi = await connection.QueryMultipleAsync(command);

                var totalCount = await multi.ReadSingleAsync<long>();
                var rows = (await multi.ReadAsync<RawAdminTripRow>()).ToList();
                var items = rows.Select(MapListItem).ToList();

                return new PagedResult<AdminTripListItemDto>(items, totalCount, normalizedPage, normalizedPageSize);
            }
            finally
            {
                if (wasClosed)
                {
                    await connection.CloseAsync();
                }
            }
        });
    }

    public async Task<AdminTripDetailDto?> GetAdminTripDetailAsync(long id, CancellationToken ct = default)
    {
        const string sql = @"
            SELECT
                t.Id,
                t.UserId,
                t.Title,
                t.Slug,
                t.Description,
                t.CoverImageUrl,
                COALESCE(NULLIF(LTRIM(RTRIM(prof.FullName)), ''), u.Email, N'Người dùng') AS AuthorName,
                prof.AvatarUrl AS AuthorAvatar,
                u.Email AS AuthorEmail,
                prim.ProvinceId,
                prim.ProvinceName,
                (SELECT COUNT(1) FROM dbo.TripDays td WHERE td.TripId = t.Id) AS DaysCount,
                (SELECT COUNT(1)
                 FROM dbo.TripDays td
                 INNER JOIN dbo.TripPlaces tp ON td.Id = tp.TripDayId
                 INNER JOIN dbo.Places pl ON tp.PlaceId = pl.Id
                 WHERE td.TripId = t.Id AND pl.IsDeleted = 0) AS StopsCount,
                CASE
                    WHEN EXISTS (SELECT 1 FROM dbo.TripMembers tm WHERE tm.TripId = t.Id AND tm.UserId = t.UserId)
                        THEN (SELECT COUNT(1) FROM dbo.TripMembers tm WHERE tm.TripId = t.Id)
                    ELSE (SELECT COUNT(1) FROM dbo.TripMembers tm WHERE tm.TripId = t.Id) + 1
                END AS MembersCount,
                COALESCE(NULLIF(t.EstimatedBudget, 0), (SELECT SUM(tp.EstimatedCost) FROM dbo.TripDays td INNER JOIN dbo.TripPlaces tp ON td.Id = tp.TripDayId WHERE td.TripId = t.Id)) AS EstimatedBudget,
                t.Privacy,
                t.Status,
                t.ViewCount,
                t.CloneCount,
                t.StartDate,
                t.EndDate,
                t.CreatedAt,
                t.UpdatedAt
            FROM dbo.Trips t
            LEFT JOIN dbo.Users u ON t.UserId = u.Id
            LEFT JOIN dbo.UserProfiles prof ON u.Id = prof.UserId
            OUTER APPLY (
                SELECT TOP 1 pl.ProvinceId, pr.Name AS ProvinceName
                FROM dbo.TripDays td
                INNER JOIN dbo.TripPlaces tp ON td.Id = tp.TripDayId
                INNER JOIN dbo.Places pl ON tp.PlaceId = pl.Id
                INNER JOIN dbo.Provinces pr ON pl.ProvinceId = pr.Id
                WHERE td.TripId = t.Id AND pl.IsDeleted = 0
                GROUP BY pl.ProvinceId, pr.Name
                ORDER BY COUNT(1) DESC, pl.ProvinceId ASC
            ) prim
            WHERE t.Id = @Id AND t.Privacy IN (0, 2);

            SELECT
                td.Id,
                td.DayNumber,
                td.DayTitle,
                td.Date
            FROM dbo.TripDays td
            WHERE td.TripId = @Id
            ORDER BY td.DayNumber ASC, td.Id ASC;

            SELECT
                tp.Id,
                tp.TripDayId,
                tp.PlaceId,
                COALESCE(pl.Name, N'Địa điểm không khả dụng') AS PlaceName,
                cat.Name AS CategoryName,
                pr.Name AS ProvinceName,
                pl.Address,
                COALESCE(
                    NULLIF(pl.CoverImageUrl, ''),
                    (SELECT TOP 1 pm.Url FROM dbo.PlaceMedia pm WHERE pm.PlaceId = pl.Id ORDER BY pm.DisplayOrder ASC, pm.Id ASC)
                ) AS CoverImageUrl,
                tp.VisitOrder,
                tp.StartTime,
                tp.EndTime,
                tp.EstimatedCost,
                tp.TransportMode,
                tp.Note
            FROM dbo.TripPlaces tp
            INNER JOIN dbo.TripDays td ON tp.TripDayId = td.Id
            LEFT JOIN dbo.Places pl ON tp.PlaceId = pl.Id
            LEFT JOIN dbo.Categories cat ON pl.CategoryId = cat.Id
            LEFT JOIN dbo.Provinces pr ON pl.ProvinceId = pr.Id
            WHERE td.TripId = @Id
            ORDER BY td.DayNumber ASC, tp.VisitOrder ASC, tp.Id ASC;

            SELECT
                tm.UserId,
                COALESCE(NULLIF(LTRIM(RTRIM(prof.FullName)), ''), u.Email, N'Người dùng') AS FullName,
                u.Email,
                prof.AvatarUrl,
                tm.Role,
                tm.JoinedAt
            FROM dbo.TripMembers tm
            INNER JOIN dbo.Users u ON tm.UserId = u.Id
            LEFT JOIN dbo.UserProfiles prof ON u.Id = prof.UserId
            WHERE tm.TripId = @Id
            ORDER BY tm.Role DESC, tm.JoinedAt ASC;";

        var strategy = _dbContext.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            var connection = _dbContext.Database.GetDbConnection();
            var wasClosed = connection.State == ConnectionState.Closed;
            if (wasClosed)
            {
                await connection.OpenAsync(ct);
            }

            try
            {
                if (!await AdminScopeFilterHelper.EnsureTripInScopeAsync(
                        _currentUserService,
                        connection,
                        id,
                        "Bạn không có quyền xem chuyến đi ngoài phạm vi tỉnh/thành phố quản lý."))
                    return null;

                var command = new CommandDefinition(sql, new { Id = id }, cancellationToken: ct);
                using var multi = await connection.QueryMultipleAsync(command);

                var tripRow = await multi.ReadFirstOrDefaultAsync<RawAdminTripRow>();
                if (tripRow == null)
                    return null;

                var dayRows = (await multi.ReadAsync<RawAdminTripDayRow>()).ToList();
                var stopRows = (await multi.ReadAsync<RawAdminTripStopRow>()).ToList();
                var memberRows = (await multi.ReadAsync<RawAdminTripMemberRow>()).ToList();

                var stopsByDay = stopRows.ToLookup(s => s.TripDayId);
                var days = dayRows.Select(d => new AdminTripDayDto
                {
                    Id = d.Id,
                    DayNumber = d.DayNumber,
                    DayTitle = d.DayTitle,
                    Date = d.Date.HasValue ? DateOnly.FromDateTime(d.Date.Value) : null,
                    Stops = stopsByDay[d.Id].Select(s => new AdminTripStopDto
                    {
                        Id = s.Id,
                        PlaceId = s.PlaceId,
                        PlaceName = s.PlaceName,
                        CategoryName = s.CategoryName,
                        ProvinceName = s.ProvinceName,
                        Address = s.Address,
                        CoverImageUrl = s.CoverImageUrl,
                        VisitOrder = s.VisitOrder,
                        StartTime = s.StartTime.HasValue ? s.StartTime.Value.ToString(@"hh\:mm", CultureInfo.InvariantCulture) : null,
                        EndTime = s.EndTime.HasValue ? s.EndTime.Value.ToString(@"hh\:mm", CultureInfo.InvariantCulture) : null,
                        EstimatedCost = s.EstimatedCost,
                        TransportMode = s.TransportMode,
                        Note = s.Note
                    }).ToList()
                }).ToList();

                var members = memberRows.Select(m => new AdminTripMemberDto
                {
                    UserId = m.UserId,
                    FullName = m.FullName,
                    Email = m.Email,
                    AvatarUrl = m.AvatarUrl,
                    Role = ((TripMemberRole)m.Role).ToString(),
                    JoinedAt = m.JoinedAt
                }).ToList();

                if (members.All(m => m.UserId != tripRow.UserId))
                {
                    members.Insert(0, new AdminTripMemberDto
                    {
                        UserId = tripRow.UserId,
                        FullName = tripRow.AuthorName,
                        Email = tripRow.AuthorEmail,
                        AvatarUrl = tripRow.AuthorAvatar,
                        Role = TripMemberRole.Owner.ToString(),
                        JoinedAt = tripRow.CreatedAt
                    });
                }

                return new AdminTripDetailDto
                {
                    Id = tripRow.Id,
                    UserId = tripRow.UserId,
                    Title = tripRow.Title,
                    Slug = tripRow.Slug,
                    Description = tripRow.Description,
                    CoverImageUrl = tripRow.CoverImageUrl,
                    AuthorName = tripRow.AuthorName,
                    AuthorAvatar = tripRow.AuthorAvatar,
                    AuthorEmail = tripRow.AuthorEmail,
                    ProvinceId = tripRow.ProvinceId,
                    ProvinceName = tripRow.ProvinceName,
                    DaysCount = tripRow.DaysCount,
                    StopsCount = tripRow.StopsCount,
                    MembersCount = members.Count,
                    EstimatedBudget = tripRow.EstimatedBudget,
                    Privacy = tripRow.Privacy,
                    PrivacyText = GetPrivacyText(tripRow.Privacy),
                    Status = tripRow.Status,
                    StatusText = GetStatusText(tripRow.Status),
                    ViewCount = tripRow.ViewCount,
                    CloneCount = tripRow.CloneCount,
                    StartDate = tripRow.StartDate.HasValue ? DateOnly.FromDateTime(tripRow.StartDate.Value) : null,
                    EndDate = tripRow.EndDate.HasValue ? DateOnly.FromDateTime(tripRow.EndDate.Value) : null,
                    CreatedAt = tripRow.CreatedAt,
                    UpdatedAt = tripRow.UpdatedAt,
                    Days = days,
                    Members = members
                };
            }
            finally
            {
                if (wasClosed)
                {
                    await connection.CloseAsync();
                }
            }
        });
    }

    public async Task<long> CreateAdminTripAsync(CreateAdminTripInput input, long authorId, CancellationToken ct = default)
    {
        var privacy = ValidatePrivacy(input.Privacy);
        var status = ValidateStatus(input.Status);

        await ValidatePlaceIdsExistAsync(input.Days, ct);
        await ValidatePlacesInAdminScopeAsync(input.Days, ct);

        long createdTripId = 0;
        var strategy = _dbContext.Database.CreateExecutionStrategy();

        await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await _dbContext.Database.BeginTransactionAsync(ct);

            var trip = new Trip(
                userId: authorId,
                title: input.Title,
                description: input.Description,
                privacy: privacy,
                startDate: input.StartDate,
                endDate: input.EndDate);

            trip.UpdateInfo(input.Title, input.Description, input.CoverImageUrl?.Trim());
            trip.UpdateBudget(input.EstimatedBudget);
            trip.ChangeStatus(status);

            _dbContext.Trips.Add(trip);
            await _dbContext.SaveChangesAsync(ct);

            _dbContext.TripMembers.Add(new TripMember(trip.Id, authorId, TripMemberRole.Owner));

            if (input.Days != null && input.Days.Count > 0)
            {
                await InsertScheduleDaysAsync(trip.Id, input.Days, ct);
            }

            await _dbContext.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
            createdTripId = trip.Id;
        });

        await _auditLogService.LogAsync(
            actionType: AdminActionType.CREATE_TRIP,
            targetTable: "Trips",
            targetId: createdTripId,
            reason: $"Tạo mới lịch trình: {input.Title.Trim()}",
            newData: new
            {
                Title = input.Title.Trim(),
                AuthorId = authorId,
                Privacy = (byte)privacy,
                Status = (byte)status,
                EstimatedBudget = input.EstimatedBudget,
                DaysCount = input.Days?.Count ?? 0
            },
            customAdminId: _currentUserService.UserId ?? authorId,
            ct: ct);

        return createdTripId;
    }

    public async Task<bool> UpdateAdminTripAsync(long id, UpdateAdminTripInput input, CancellationToken ct = default)
    {
        if (!await AdminScopeFilterHelper.EnsureTripInScopeAsync(
                _currentUserService,
                _dbContext.Database.GetDbConnection(),
                id,
                "Bạn không có quyền chỉnh sửa chuyến đi ngoài phạm vi tỉnh/thành phố quản lý."))
            return false;

        var privacy = ValidatePrivacy(input.Privacy);
        var status = ValidateStatus(input.Status);

        if (input.ReplaceSchedule)
        {
            await ValidatePlaceIdsExistAsync(input.Days, ct);
            await ValidatePlacesInAdminScopeAsync(input.Days, ct);
        }

        object? oldData = null;
        var found = false;

        var strategy = _dbContext.Database.CreateExecutionStrategy();
        await strategy.ExecuteAsync(async () =>
        {
            var trip = await _dbContext.Trips.FirstOrDefaultAsync(t => t.Id == id, ct);
            if (trip == null || trip.Privacy == TripPrivacy.FriendsOnly)
            {
                found = false;
                return;
            }

            found = true;
            oldData = new
            {
                Title = trip.Title,
                Description = trip.Description,
                CoverImageUrl = trip.CoverImageUrl,
                StartDate = trip.StartDate,
                EndDate = trip.EndDate,
                EstimatedBudget = trip.EstimatedBudget,
                Privacy = (byte)trip.Privacy,
                Status = (byte)trip.Status
            };

            await using var transaction = await _dbContext.Database.BeginTransactionAsync(ct);

            trip.UpdateInfo(input.Title, input.Description, input.CoverImageUrl?.Trim());
            trip.UpdateDates(input.StartDate, input.EndDate);
            trip.UpdateBudget(input.EstimatedBudget);
            trip.ChangePrivacy(privacy);
            trip.ChangeStatus(status);

            if (input.ReplaceSchedule)
            {
                var existingDays = await _dbContext.TripDays
                    .Where(d => d.TripId == id)
                    .ToListAsync(ct);

                if (existingDays.Count > 0)
                {
                    _dbContext.TripDays.RemoveRange(existingDays);
                    await _dbContext.SaveChangesAsync(ct);
                }

                if (input.Days != null && input.Days.Count > 0)
                {
                    await InsertScheduleDaysAsync(id, input.Days, ct);
                }
            }

            await _dbContext.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
        });

        if (!found)
            return false;

        await _auditLogService.LogAsync(
            actionType: AdminActionType.UPDATE_TRIP,
            targetTable: "Trips",
            targetId: id,
            reason: $"Cập nhật lịch trình #{id}: {input.Title.Trim()}",
            oldData: oldData,
            newData: new
            {
                Title = input.Title.Trim(),
                Description = input.Description,
                CoverImageUrl = input.CoverImageUrl?.Trim(),
                StartDate = input.StartDate,
                EndDate = input.EndDate,
                EstimatedBudget = input.EstimatedBudget,
                Privacy = (byte)privacy,
                Status = (byte)status,
                ReplaceSchedule = input.ReplaceSchedule,
                DaysCount = input.Days?.Count
            },
            ct: ct);

        return true;
    }

    public async Task<bool> UpdateAdminTripPrivacyAsync(long id, byte privacy, string? reason, CancellationToken ct = default)
    {
        if (!await AdminScopeFilterHelper.EnsureTripInScopeAsync(
                _currentUserService,
                _dbContext.Database.GetDbConnection(),
                id,
                "Bạn không có quyền thay đổi quyền hiển thị chuyến đi ngoài phạm vi tỉnh/thành phố quản lý."))
            return false;

        var newPrivacy = ValidatePrivacy(privacy);

        var trip = await _dbContext.Trips.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (trip == null || trip.Privacy == TripPrivacy.FriendsOnly)
            return false;

        if (newPrivacy == TripPrivacy.FriendsOnly)
            throw new ArgumentException("Chỉ hỗ trợ chuyển đổi giữa Công khai và Đã ẩn.", nameof(privacy));

        if (newPrivacy == TripPrivacy.Public)
        {
            var hasValidStop = await _dbContext.TripDays
                .AsNoTracking()
                .Where(d => d.TripId == id)
                .SelectMany(d => d.Places)
                .AnyAsync(p => p.Place != null && !p.Place.IsDeleted, ct);

            if (string.IsNullOrWhiteSpace(trip.Title) ||
                string.IsNullOrWhiteSpace(trip.Description) ||
                string.IsNullOrWhiteSpace(trip.CoverImageUrl) ||
                !hasValidStop)
            {
                throw new ArgumentException("Không thể công khai lịch trình thiếu tên, mô tả, ảnh bìa hoặc chưa có địa điểm tham quan.");
            }
        }

        var oldPrivacy = (byte)trip.Privacy;
        trip.ChangePrivacy(newPrivacy);
        await _dbContext.SaveChangesAsync(ct);

        await _auditLogService.LogAsync(
            actionType: AdminActionType.UPDATE_TRIP_PRIVACY,
            targetTable: "Trips",
            targetId: id,
            reason: string.IsNullOrWhiteSpace(reason)
                ? $"Thay đổi quyền riêng tư lịch trình #{id} sang {GetPrivacyText(privacy)}"
                : reason.Trim(),
            oldData: new { Privacy = oldPrivacy },
            newData: new { Privacy = privacy },
            ct: ct);

        return true;
    }

    public async Task<bool> UpdateAdminTripStatusAsync(long id, byte status, string? reason, CancellationToken ct = default)
    {
        if (!await AdminScopeFilterHelper.EnsureTripInScopeAsync(
                _currentUserService,
                _dbContext.Database.GetDbConnection(),
                id,
                "Bạn không có quyền thay đổi trạng thái chuyến đi ngoài phạm vi tỉnh/thành phố quản lý."))
            return false;

        var newStatus = ValidateStatus(status);

        var trip = await _dbContext.Trips.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (trip == null || trip.Privacy == TripPrivacy.FriendsOnly)
            return false;

        var oldStatus = (byte)trip.Status;
        trip.ChangeStatus(newStatus);
        await _dbContext.SaveChangesAsync(ct);

        await _auditLogService.LogAsync(
            actionType: AdminActionType.UPDATE_TRIP_STATUS,
            targetTable: "Trips",
            targetId: id,
            reason: string.IsNullOrWhiteSpace(reason)
                ? $"Thay đổi trạng thái lịch trình #{id} sang {GetStatusText(status)}"
                : reason.Trim(),
            oldData: new { Status = oldStatus },
            newData: new { Status = status },
            ct: ct);

        return true;
    }

    public async Task<bool> DeleteAdminTripAsync(long id, CancellationToken ct = default)
    {
        if (!await AdminScopeFilterHelper.EnsureTripInScopeAsync(
                _currentUserService,
                _dbContext.Database.GetDbConnection(),
                id,
                "Bạn không có quyền xóa chuyến đi ngoài phạm vi tỉnh/thành phố quản lý."))
            return false;

        var trip = await _dbContext.Trips.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (trip == null || trip.Privacy == TripPrivacy.FriendsOnly)
            return false;

        var oldData = new
        {
            Id = trip.Id,
            Title = trip.Title,
            UserId = trip.UserId,
            Privacy = (byte)trip.Privacy,
            Status = (byte)trip.Status
        };

        _dbContext.Trips.Remove(trip);
        await _dbContext.SaveChangesAsync(ct);

        await _auditLogService.LogAsync(
            actionType: AdminActionType.DELETE_TRIP,
            targetTable: "Trips",
            targetId: id,
            reason: $"Xóa lịch trình #{id} ({trip.Title})",
            oldData: oldData,
            ct: ct);

        return true;
    }

    private async Task ValidatePlaceIdsExistAsync(List<AdminTripDayInput>? days, CancellationToken ct)
    {
        if (days == null || days.Count == 0)
            return;

        var placeIds = days
            .Where(d => d.Stops != null)
            .SelectMany(d => d.Stops!)
            .Select(s => s.PlaceId)
            .Distinct()
            .ToList();

        if (placeIds.Count == 0)
            return;

        var validCount = await _dbContext.Places
            .AsNoTracking()
            .CountAsync(p => placeIds.Contains(p.Id) && !p.IsDeleted, ct);

        if (validCount != placeIds.Count)
            throw new ArgumentException("Một hoặc nhiều địa điểm trong lịch trình không tồn tại hoặc đã bị xóa.");
    }

    private async Task ValidatePlacesInAdminScopeAsync(List<AdminTripDayInput>? days, CancellationToken ct)
    {
        if (_currentUserService.IsSystemAdmin)
            return;

        var provScopes = _currentUserService.ProvinceScopes;
        if (provScopes.Count == 0)
            throw new UnauthorizedAccessException("Bạn không có quyền quản lý chuyến đi do chưa được phân công phạm vi tỉnh/thành phố.");

        var placeIds = days?
            .Where(d => d.Stops != null)
            .SelectMany(d => d.Stops!)
            .Select(s => s.PlaceId)
            .Distinct()
            .ToList() ?? new List<long>();

        if (placeIds.Count == 0)
            throw new UnauthorizedAccessException("Chuyến đi phải có ít nhất một địa điểm thuộc phạm vi tỉnh/thành phố quản lý.");

        var outOfScopeExists = await _dbContext.Places
            .AsNoTracking()
            .AnyAsync(p => placeIds.Contains(p.Id) && !p.IsDeleted && !provScopes.Contains(p.ProvinceId), ct);

        if (outOfScopeExists)
            throw new UnauthorizedAccessException("Bạn không có quyền thêm địa điểm ngoài phạm vi tỉnh/thành phố quản lý.");
    }

    private async Task InsertScheduleDaysAsync(long tripId, List<AdminTripDayInput> days, CancellationToken ct)
    {
        foreach (var dayInput in days.OrderBy(d => d.DayNumber))
        {
            var day = new TripDay(tripId, dayInput.DayNumber, dayInput.DayTitle, dayInput.Date);
            _dbContext.TripDays.Add(day);
            await _dbContext.SaveChangesAsync(ct);

            if (dayInput.Stops == null || dayInput.Stops.Count == 0)
                continue;

            foreach (var stopInput in dayInput.Stops.OrderBy(s => s.VisitOrder))
            {
                var startTime = ParseTime(stopInput.StartTime);
                var endTime = ParseTime(stopInput.EndTime);

                var placeStop = new TripPlace(
                    tripDayId: day.Id,
                    placeId: stopInput.PlaceId,
                    visitOrder: stopInput.VisitOrder,
                    startTime: startTime,
                    endTime: endTime,
                    estimatedCost: stopInput.EstimatedCost,
                    transportMode: stopInput.TransportMode,
                    note: stopInput.Note);

                _dbContext.TripPlaces.Add(placeStop);
            }
        }
    }

    private static AdminTripListItemDto MapListItem(RawAdminTripRow row)
    {
        return new AdminTripListItemDto
        {
            Id = row.Id,
            UserId = row.UserId,
            Title = row.Title,
            Slug = row.Slug,
            Description = row.Description,
            CoverImageUrl = row.CoverImageUrl,
            AuthorName = row.AuthorName,
            AuthorAvatar = row.AuthorAvatar,
            AuthorEmail = row.AuthorEmail,
            ProvinceId = row.ProvinceId,
            ProvinceName = row.ProvinceName,
            DaysCount = row.DaysCount,
            StopsCount = row.StopsCount,
            MembersCount = row.MembersCount,
            EstimatedBudget = row.EstimatedBudget,
            Privacy = row.Privacy,
            PrivacyText = GetPrivacyText(row.Privacy),
            Status = row.Status,
            StatusText = GetStatusText(row.Status),
            ViewCount = row.ViewCount,
            CloneCount = row.CloneCount,
            StartDate = row.StartDate.HasValue ? DateOnly.FromDateTime(row.StartDate.Value) : null,
            EndDate = row.EndDate.HasValue ? DateOnly.FromDateTime(row.EndDate.Value) : null,
            CreatedAt = row.CreatedAt,
            UpdatedAt = row.UpdatedAt
        };
    }

    private static TripPrivacy ValidatePrivacy(byte privacy)
    {
        if (!Enum.IsDefined(typeof(TripPrivacy), privacy))
            throw new ArgumentException("Giá trị quyền riêng tư không hợp lệ.", nameof(privacy));
        return (TripPrivacy)privacy;
    }

    private static TripStatus ValidateStatus(byte status)
    {
        if (!Enum.IsDefined(typeof(TripStatus), status))
            throw new ArgumentException("Trạng thái lịch trình không hợp lệ.", nameof(status));
        return (TripStatus)status;
    }

    private static TimeOnly? ParseTime(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        var trimmed = value.Trim();
        if (TimeOnly.TryParseExact(trimmed, new[] { "HH:mm", "H:mm", "HH:mm:ss", "H:mm:ss" }, CultureInfo.InvariantCulture, DateTimeStyles.None, out var exact))
            return exact;

        if (TimeOnly.TryParse(trimmed, CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsed))
            return parsed;

        throw new ArgumentException($"Định dạng thời gian không hợp lệ: '{value}'.");
    }

    private static string GetPrivacyText(byte privacy) => privacy switch
    {
        0 => "Công khai",
        1 => "Bản nháp",
        2 => "Đã ẩn",
        _ => "Không xác định"
    };

    private static string GetStatusText(byte status) => status switch
    {
        0 => "Lên kế hoạch",
        1 => "Đang diễn ra",
        2 => "Hoàn thành",
        _ => "Không xác định"
    };
}
