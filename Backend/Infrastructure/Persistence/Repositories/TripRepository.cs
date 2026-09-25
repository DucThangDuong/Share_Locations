using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using Dapper;
using Domain.Enums;
using Infrastructure.Persistence;
using Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class TripRepository : ITripRepository
{
    private readonly TravelReviewDbContext _dbContext;

    public TripRepository(TravelReviewDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Task<IReadOnlyList<ItineraryDto>> GetItinerariesAsync(
        string? duration,
        string? keyword,
        int page,
        int pageSize,
        CancellationToken ct = default)
    {
        return GetItinerariesAsync(new ItineraryFilterParams
        {
            Duration = duration,
            Keyword = keyword,
            Page = page,
            PageSize = pageSize
        }, ct);
    }

    public async Task<IReadOnlyList<ItineraryDto>> GetItinerariesAsync(
        ItineraryFilterParams p,
        CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        var conditions = new List<string> { "t.Privacy = 0" };
        var parameters = new DynamicParameters();

        if (!string.IsNullOrWhiteSpace(p.Keyword))
        {
            conditions.Add("(t.Title LIKE @Keyword OR t.Description LIKE @Keyword)");
            parameters.Add("Keyword", $"%{p.Keyword.Trim()}%");
        }

        if (!string.IsNullOrWhiteSpace(p.Duration) && p.Duration != "all")
        {
            if (int.TryParse(p.Duration, out var durationDays))
            {
                conditions.Add("(SELECT COUNT(1) FROM dbo.TripDays td WHERE td.TripId = t.Id) = @DaysFilter");
                parameters.Add("DaysFilter", durationDays);
            }
            else if (p.Duration.Contains("4"))
            {
                conditions.Add("(SELECT COUNT(1) FROM dbo.TripDays td WHERE td.TripId = t.Id) >= 4");
            }
        }

        var whereClause = string.Join(" AND ", conditions);
        var offset = Math.Max(0, (p.Page - 1) * p.PageSize);
        parameters.Add("Offset", offset);
        parameters.Add("PageSize", Math.Max(1, p.PageSize));

        var sql = $@"
            SELECT 
                t.Id,
                t.UserId,
                t.Title,
                t.Description,
                t.CoverImageUrl,
                t.StartDate,
                t.EndDate,
                t.Privacy,
                ISNULL(up.FullName, N'Lang Thang Editor') AS AuthorName,
                up.AvatarUrl AS AuthorAvatar,
                (SELECT COUNT(1) FROM dbo.TripDays td WHERE td.TripId = t.Id) AS DayCount
            FROM dbo.Trips t
            LEFT JOIN dbo.UserProfiles up ON t.UserId = up.UserId
            WHERE {whereClause}
            ORDER BY t.CreatedAt DESC
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;";

        var trips = (await connection.QueryAsync<RawTripRow>(sql, parameters)).ToList();

        if (trips.Count == 0)
        {
            return Array.Empty<ItineraryDto>();
        }

        var tripIds = trips.Select(t => t.Id).ToList();

        const string daysSql = @"
            SELECT td.TripId, td.Id, td.DayNumber, td.DayTitle
            FROM dbo.TripDays td
            WHERE td.TripId IN @TripIds
            ORDER BY td.TripId, td.DayNumber;";

        var days = (await connection.QueryAsync<RawTripDay>(daysSql, new { TripIds = tripIds })).ToList();
        var dayIds = days.Select(d => d.Id).ToList();

        List<RawTripStop> stops = new();
        if (dayIds.Count > 0)
        {
            const string stopsSql = @"
                SELECT 
                    tp.TripDayId,
                    tp.VisitOrder,
                    tp.StartTime,
                    tp.EndTime,
                    tp.EstimatedCost,
                    tp.TransportMode,
                    tp.Note,
                    p.Name AS PlaceName,
                    p.Address AS PlaceAddress,
                    p.Description AS PlaceDescription
                FROM dbo.TripPlaces tp
                INNER JOIN dbo.Places p ON tp.PlaceId = p.Id
                WHERE tp.TripDayId IN @DayIds
                ORDER BY tp.TripDayId, tp.VisitOrder;";

            stops = (await connection.QueryAsync<RawTripStop>(stopsSql, new { DayIds = dayIds })).ToList();
        }

        var daysByTrip = days.ToLookup(d => d.TripId);
        var stopsByDay = stops.ToLookup(s => s.TripDayId);

        var result = new List<ItineraryDto>();

        foreach (var trip in trips)
        {
            int calculatedDays = trip.DayCount > 0 ? trip.DayCount : 1;
            int calculatedNights = Math.Max(0, calculatedDays - 1);
            string durationText = calculatedDays == 1 ? "1 Ngày (Đi về trong ngày)" : $"{calculatedDays} Ngày {calculatedNights} Đêm";

            var dayDtos = new List<ItineraryDayDto>();
            foreach (var day in daysByTrip[trip.Id])
            {
                var stopDtos = stopsByDay[day.Id].Select(s => new ItineraryStopDto
                {
                    Time = s.StartTime.HasValue ? s.StartTime.Value.ToString(@"hh\:mm") : "09:00",
                    Activity = !string.IsNullOrWhiteSpace(s.PlaceName) ? s.PlaceName : (!string.IsNullOrWhiteSpace(s.Note) ? s.Note : "Điểm tham quan"),
                    PlaceName = s.PlaceName,
                    Note = s.Note,
                    Location = s.PlaceAddress ?? s.PlaceName,
                    Description = s.PlaceDescription,
                    CostEstimate = s.EstimatedCost.HasValue ? s.EstimatedCost.Value.ToString("N0") + " VNĐ" : "Tự túc",
                    Tips = string.IsNullOrWhiteSpace(s.TransportMode) ? "Nên mang trang phục phù hợp và máy ảnh." : $"Di chuyển bằng: {s.TransportMode}. Nên mang trang phục phù hợp và máy ảnh."
                }).ToList();

                dayDtos.Add(new ItineraryDayDto
                {
                    DayNumber = day.DayNumber,
                    Title = day.DayTitle ?? $"Ngày {day.DayNumber}: Khám phá địa điểm nổi tiếng",
                    Stops = stopDtos
                });
            }

            string detectedRegion = "central";
            if (trip.Title.Contains("Hà Nội") || trip.Title.Contains("Bắc") || trip.Title.Contains("Sa Pa") || trip.Title.Contains("Hạ Long") || trip.Title.Contains("Sơn La") || trip.Title.Contains("Hà Giang") || trip.Title.Contains("Mộc Châu") || trip.Title.Contains("Ninh Bình"))
                detectedRegion = "north";
            else if (trip.Title.Contains("Sài Gòn") || trip.Title.Contains("Nam") || trip.Title.Contains("Cần Thơ") || trip.Title.Contains("Phú Quốc") || trip.Title.Contains("Miền Tây") || trip.Title.Contains("Vũng Tàu"))
                detectedRegion = "south";

            result.Add(new ItineraryDto
            {
                Id = trip.Id,
                Title = trip.Title,
                Destination = trip.Title,
                Region = detectedRegion,
                Duration = durationText,
                DaysCount = calculatedDays,
                Style = "Văn hóa & Trải nghiệm",
                EstimatedCost = $"{calculatedDays * 1200000:N0}đ",
                CoverUrl = trip.CoverImageUrl,
                Author = new ItineraryAuthorDto
                {
                    Name = trip.AuthorName ?? "Cộng tác viên Lang Thang",
                    Avatar = trip.AuthorAvatar
                },
                Overview = trip.Description,
                Days = dayDtos
            });
        }

        return result;
    }

    public async Task<bool> IsItinerarySavedAsync(
        long userId,
        long tripId,
        CancellationToken ct = default)
    {
        return await _dbContext.Favorites
            .AsNoTracking()
            .AnyAsync(f => f.UserId == userId && f.TargetId == tripId && f.TargetType == FavoriteTargetType.Trip, ct);
    }

    public async Task<PagedResult<UserTripSummaryDto>> GetUserTripsAsync(
        long userId,
        string? status,
        byte? privacy,
        int page,
        int pageSize,
        CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        var conditions = new List<string>
        {
            "(t.UserId = @UserId OR EXISTS (SELECT 1 FROM dbo.TripMembers tm WHERE tm.TripId = t.Id AND tm.UserId = @UserId))"
        };
        var parameters = new DynamicParameters();
        parameters.Add("UserId", userId);

        if (!string.IsNullOrWhiteSpace(status) && status.ToLowerInvariant() != "all")
        {
            var st = status.ToLowerInvariant();
            if (st == "planning" || st == "0")
                conditions.Add("t.Status = 0");
            else if (st == "ongoing" || st == "1")
                conditions.Add("t.Status = 1");
            else if (st == "completed" || st == "2")
                conditions.Add("t.Status = 2");
        }

        if (privacy.HasValue)
        {
            conditions.Add("t.Privacy = @Privacy");
            parameters.Add("Privacy", privacy.Value);
        }

        var whereClause = string.Join(" AND ", conditions);
        var countSql = $"SELECT COUNT(1) FROM dbo.Trips t WHERE {whereClause}";
        var totalCount = await connection.ExecuteScalarAsync<long>(new CommandDefinition(countSql, parameters, cancellationToken: ct));

        var offset = (page - 1) * pageSize;
        parameters.Add("Offset", offset);
        parameters.Add("PageSize", pageSize);

        var sql = $@"
            SELECT 
                t.Id,
                t.Title,
                t.Description,
                t.CoverImageUrl,
                t.StartDate,
                t.EndDate,
                t.Privacy,
                t.Status,
                t.CreatedAt,
                CASE 
                    WHEN t.UserId = @UserId THEN 'Owner'
                    ELSE ISNULL((SELECT CASE tm.Role WHEN 3 THEN 'Owner' WHEN 2 THEN 'Editor' ELSE 'Member' END FROM dbo.TripMembers tm WHERE tm.TripId = t.Id AND tm.UserId = @UserId), 'Member')
                END AS UserRole,
                ISNULL((SELECT COUNT(1) FROM dbo.TripMembers tm WHERE tm.TripId = t.Id), 1) AS MembersCount,
                ISNULL((SELECT COUNT(1) FROM dbo.TripPlaces tp JOIN dbo.TripDays td ON tp.TripDayId = td.Id WHERE td.TripId = t.Id), 0) AS TotalStopsCount,
                ISNULL((SELECT SUM(tp.EstimatedCost) FROM dbo.TripPlaces tp JOIN dbo.TripDays td ON tp.TripDayId = td.Id WHERE td.TripId = t.Id), 0) AS EstimatedBudget
            FROM dbo.Trips t
            WHERE {whereClause}
            ORDER BY t.CreatedAt DESC
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY";

        var rows = await connection.QueryAsync(new CommandDefinition(sql, parameters, cancellationToken: ct));

        var items = new List<UserTripSummaryDto>();
        foreach (var r in rows)
        {
            DateTime? startDate = r.StartDate != null ? (DateTime)r.StartDate : null;
            DateTime? endDate = r.EndDate != null ? (DateTime)r.EndDate : null;

            int durationDays = 1;
            if (startDate.HasValue && endDate.HasValue)
            {
                durationDays = Math.Max(1, (endDate.Value.Date - startDate.Value.Date).Days + 1);
            }
            int nightsCount = Math.Max(0, durationDays - 1);

            items.Add(new UserTripSummaryDto
            {
                Id = (long)r.Id,
                Title = (string)r.Title,
                Description = (string?)r.Description,
                CoverImageUrl = (string?)r.CoverImageUrl,
                Province = null,
                Region = null,
                StartDate = startDate?.ToString("yyyy-MM-dd"),
                EndDate = endDate?.ToString("yyyy-MM-dd"),
                DurationDays = durationDays,
                NightsCount = nightsCount,
                EstimatedBudget = (decimal)r.EstimatedBudget,
                Privacy = (byte)r.Privacy,
                Status = (byte)r.Status,
                UserRole = (string)r.UserRole,
                MembersCount = (int)r.MembersCount,
                TotalStopsCount = (int)r.TotalStopsCount,
                CreatedAt = (DateTime)r.CreatedAt
            });
        }

        return new PagedResult<UserTripSummaryDto>(items, totalCount, page, pageSize);
    }

    public async Task<TripDetailDto?> GetTripDetailAsync(
        long tripId,
        long? currentUserId,
        CancellationToken ct = default)
    {
        var trip = await _dbContext.Trips
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == tripId, ct);

        if (trip == null)
            return null;

        string? currentUserRole = null;
        if (currentUserId.HasValue)
        {
            if (trip.UserId == currentUserId.Value)
            {
                currentUserRole = "Owner";
            }
            else
            {
                var member = await _dbContext.TripMembers
                    .AsNoTracking()
                    .FirstOrDefaultAsync(m => m.TripId == tripId && m.UserId == currentUserId.Value, ct);

                if (member != null)
                {
                    currentUserRole = member.Role.ToString();
                }
            }
        }

        if (trip.Privacy == TripPrivacy.Private)
        {
            if (!currentUserId.HasValue || currentUserRole == null)
            {
                return null;
            }
        }

        var members = await _dbContext.TripMembers
            .AsNoTracking()
            .Where(m => m.TripId == tripId)
            .Include(m => m.User)
                .ThenInclude(u => u.Profile)
            .ToListAsync(ct);

        var memberDtos = new List<TripMemberDetailDto>();
        var ownerUser = await _dbContext.Users
            .AsNoTracking()
            .Include(u => u.Profile)
            .FirstOrDefaultAsync(u => u.Id == trip.UserId, ct);

        if (ownerUser != null && !members.Any(m => m.UserId == trip.UserId))
        {
            memberDtos.Add(new TripMemberDetailDto
            {
                UserId = ownerUser.Id,
                FullName = !string.IsNullOrWhiteSpace(ownerUser.Profile?.FullName) ? ownerUser.Profile.FullName : ownerUser.Email,
                AvatarUrl = ownerUser.Profile?.AvatarUrl,
                Email = ownerUser.Email,
                Role = "Owner"
            });
        }

        foreach (var m in members)
        {
            memberDtos.Add(new TripMemberDetailDto
            {
                UserId = m.UserId,
                FullName = !string.IsNullOrWhiteSpace(m.User.Profile?.FullName) ? m.User.Profile.FullName : m.User.Email,
                AvatarUrl = m.User.Profile?.AvatarUrl,
                Email = m.User.Email,
                Role = m.Role.ToString()
            });
        }

        var days = await _dbContext.TripDays
            .AsNoTracking()
            .Where(d => d.TripId == tripId)
            .OrderBy(d => d.DayNumber)
            .Include(d => d.Places)
                .ThenInclude(p => p.Place)
            .ToListAsync(ct);

        var dayDtos = new List<TripDayDetailDto>();
        decimal estimatedBudget = 0;

        foreach (var day in days)
        {
            var stopDtos = new List<TripPlaceDetailDto>();
            foreach (var sp in day.Places.OrderBy(p => p.VisitOrder).ThenBy(p => p.StartTime))
            {
                if (sp.EstimatedCost.HasValue)
                {
                    estimatedBudget += sp.EstimatedCost.Value;
                }

                stopDtos.Add(new TripPlaceDetailDto
                {
                    Id = sp.Id,
                    PlaceId = sp.PlaceId,
                    Name = sp.Place?.Name ?? string.Empty,
                    Category = null,
                    Address = sp.Place?.Address,
                    Latitude = (double?)sp.Place?.Latitude,
                    Longitude = (double?)sp.Place?.Longitude,
                    VisitOrder = sp.VisitOrder,
                    StartTime = sp.StartTime.HasValue ? sp.StartTime.Value.ToString(@"hh\:mm") : null,
                    EndTime = sp.EndTime.HasValue ? sp.EndTime.Value.ToString(@"hh\:mm") : null,
                    EstimatedCost = sp.EstimatedCost,
                    TransportMode = sp.TransportMode,
                    Note = sp.Note,
                    ImageUrl = sp.Place?.CoverImageUrl
                });
            }

            dayDtos.Add(new TripDayDetailDto
            {
                Id = day.Id,
                DayNumber = day.DayNumber,
                DayTitle = day.DayTitle,
                Date = day.Date.HasValue ? day.Date.Value.ToString("yyyy-MM-dd") : null,
                Stops = stopDtos
            });
        }

        int durationDays = 1;
        if (trip.StartDate.HasValue && trip.EndDate.HasValue)
        {
            durationDays = Math.Max(1, trip.EndDate.Value.DayNumber - trip.StartDate.Value.DayNumber + 1);
        }
        else if (dayDtos.Count > 0)
        {
            durationDays = dayDtos.Count;
        }

        return new TripDetailDto
        {
            Id = trip.Id,
            Title = trip.Title,
            Description = trip.Description,
            CoverImageUrl = trip.CoverImageUrl,
            Province = null,
            Region = null,
            StartDate = trip.StartDate.HasValue ? trip.StartDate.Value.ToString("yyyy-MM-dd") : null,
            EndDate = trip.EndDate.HasValue ? trip.EndDate.Value.ToString("yyyy-MM-dd") : null,
            DurationDays = durationDays,
            NightsCount = Math.Max(0, durationDays - 1),
            EstimatedBudget = estimatedBudget,
            BudgetTarget = null,
            Privacy = (byte)trip.Privacy,
            Status = (byte)trip.Status,
            CurrentUserRole = currentUserRole,
            Members = memberDtos,
            Days = dayDtos
        };
    }

    public async Task<IReadOnlyList<PublicTripSummaryDto>> GetUserPublicTripsAsync(
        long userId,
        CancellationToken ct = default)
    {
        var trips = await _dbContext.Trips
            .AsNoTracking()
            .Where(t => t.UserId == userId && t.Privacy == TripPrivacy.Public)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync(ct);

        var result = new List<PublicTripSummaryDto>();
        foreach (var t in trips)
        {
            int durationDays = 1;
            if (t.StartDate.HasValue && t.EndDate.HasValue)
            {
                durationDays = Math.Max(1, t.EndDate.Value.DayNumber - t.StartDate.Value.DayNumber + 1);
            }
            result.Add(new PublicTripSummaryDto
            {
                Id = t.Id,
                Title = t.Title,
                Province = null,
                DurationDays = durationDays,
                NightsCount = Math.Max(0, durationDays - 1),
                CoverImageUrl = t.CoverImageUrl
            });
        }
        return result;
    }

    public async Task<TripMemberRole?> GetUserTripRoleAsync(
        long tripId,
        long userId,
        CancellationToken ct = default)
    {
        var trip = await _dbContext.Trips
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == tripId, ct);

        if (trip == null)
            return null;

        if (trip.UserId == userId)
            return TripMemberRole.Owner;

        var member = await _dbContext.TripMembers
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.TripId == tripId && m.UserId == userId, ct);

        return member?.Role;
    }

    public async Task<bool> IsUserMemberOrOwnerAsync(
        long tripId,
        long userId,
        CancellationToken ct = default)
    {
        var isOwner = await _dbContext.Trips
            .AsNoTracking()
            .AnyAsync(t => t.Id == tripId && t.UserId == userId, ct);

        if (isOwner)
            return true;

        return await _dbContext.TripMembers
            .AsNoTracking()
            .AnyAsync(m => m.TripId == tripId && m.UserId == userId, ct);
    }
}
