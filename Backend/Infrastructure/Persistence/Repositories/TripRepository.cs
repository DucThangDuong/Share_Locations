using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using Dapper;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class TripRepository : ITripRepository
{
    private readonly TravelReviewDbContext _dbContext;

    public TripRepository(TravelReviewDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    private class RawTripRow
    {
        public long Id { get; set; }
        public long UserId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? CoverImageUrl { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public byte Privacy { get; set; }
        public string? AuthorName { get; set; }
        public string? AuthorAvatar { get; set; }
        public int DayCount { get; set; }
    }

    private class RawTripDay
    {
        public long TripId { get; set; }
        public long Id { get; set; }
        public int DayNumber { get; set; }
        public string? DayTitle { get; set; }
    }

    private class RawTripStop
    {
        public long TripDayId { get; set; }
        public int VisitOrder { get; set; }
        public TimeSpan? PlannedTime { get; set; }
        public string? Note { get; set; }
        public string PlaceName { get; set; } = string.Empty;
        public string? PlaceAddress { get; set; }
        public string? PlaceDescription { get; set; }
    }

    public async Task<IReadOnlyList<ItineraryDto>> GetItinerariesAsync(
        string? duration,
        string? region,
        string? keyword,
        int page,
        int pageSize,
        CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        var conditions = new List<string> { "t.Privacy = 0" };
        var parameters = new DynamicParameters();

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            conditions.Add("(t.Title LIKE @Keyword OR t.Description LIKE @Keyword)");
            parameters.Add("Keyword", $"%{keyword.Trim()}%");
        }

        if (!string.IsNullOrWhiteSpace(duration) && duration != "all")
        {
            if (int.TryParse(duration, out var durationDays))
            {
                conditions.Add("(SELECT COUNT(1) FROM dbo.TripDays td WHERE td.TripId = t.Id) = @DaysFilter");
                parameters.Add("DaysFilter", durationDays);
            }
            else if (duration.Contains("4"))
            {
                conditions.Add("(SELECT COUNT(1) FROM dbo.TripDays td WHERE td.TripId = t.Id) >= 4");
            }
        }

        if (!string.IsNullOrWhiteSpace(region))
        {
            var reg = region.Trim().ToLowerInvariant();
            if (reg.Contains("north") || reg.Contains("bắc") || reg.Contains("bac"))
            {
                conditions.Add("(t.Title LIKE N'%Bắc%' OR t.Description LIKE N'%Bắc%')");
            }
            else if (reg.Contains("central") || reg.Contains("trung"))
            {
                conditions.Add("(t.Title LIKE N'%Trung%' OR t.Title LIKE N'%Đà Nẵng%' OR t.Title LIKE N'%Huế%' OR t.Title LIKE N'%Hội An%' OR t.Description LIKE N'%Trung%')");
            }
            else if (reg.Contains("south") || reg.Contains("nam"))
            {
                conditions.Add("(t.Title LIKE N'%Nam%' OR t.Title LIKE N'%Sài Gòn%' OR t.Title LIKE N'%Phú Quốc%' OR t.Description LIKE N'%Nam%')");
            }
        }

        var whereClause = string.Join(" AND ", conditions);
        var offset = Math.Max(0, (page - 1) * pageSize);
        parameters.Add("Offset", offset);
        parameters.Add("PageSize", Math.Max(1, pageSize));

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
                    tp.PlannedTime,
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
                    Time = s.PlannedTime.HasValue ? s.PlannedTime.Value.ToString(@"hh\:mm") : "09:00",
                    Activity = !string.IsNullOrWhiteSpace(s.Note) ? s.Note : $"Tham quan {s.PlaceName}",
                    Location = s.PlaceAddress ?? s.PlaceName,
                    Description = s.PlaceDescription,
                    CostEstimate = "Tự túc",
                    Tips = "Nên mang trang phục phù hợp và máy ảnh."
                }).ToList();

                dayDtos.Add(new ItineraryDayDto
                {
                    DayNumber = day.DayNumber,
                    Title = day.DayTitle ?? $"Ngày {day.DayNumber}: Khám phá địa điểm nổi tiếng",
                    Stops = stopDtos
                });
            }

            string detectedRegion = "central";
            if (trip.Title.Contains("Hà Nội") || trip.Title.Contains("Bắc") || trip.Title.Contains("Sa Pa") || trip.Title.Contains("Hạ Long"))
                detectedRegion = "north";
            else if (trip.Title.Contains("Sài Gòn") || trip.Title.Contains("Nam") || trip.Title.Contains("Cần Thơ") || trip.Title.Contains("Phú Quốc"))
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
                EstimatedCost = $"{calculatedDays * 1200000:N0}đ / người",
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

    public async Task<bool> SaveItineraryAsync(
        long userId,
        long tripId,
        CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        const string sql = @"
            IF NOT EXISTS (SELECT 1 FROM dbo.Favorites WHERE UserId = @UserId AND TargetId = @TripId AND TargetType = 3)
            BEGIN
                INSERT INTO dbo.Favorites (UserId, TargetId, TargetType, CreatedAt)
                VALUES (@UserId, @TripId, 3, SYSUTCDATETIME());
            END";

        await connection.ExecuteAsync(sql, new { UserId = userId, TripId = tripId });
        return true;
    }

    public async Task<bool> IsItinerarySavedAsync(
        long userId,
        long tripId,
        CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        const string sql = "SELECT COUNT(1) FROM dbo.Favorites WHERE UserId = @UserId AND TargetId = @TripId AND TargetType = 3;";
        var count = await connection.ExecuteScalarAsync<int>(sql, new { UserId = userId, TripId = tripId });
        return count > 0;
    }
}
