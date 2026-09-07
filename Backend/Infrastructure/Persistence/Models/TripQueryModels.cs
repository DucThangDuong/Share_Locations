namespace Infrastructure.Persistence.Models;

internal sealed class RawTripRow
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

internal sealed class RawTripDay
{
    public long TripId { get; set; }
    public long Id { get; set; }
    public int DayNumber { get; set; }
    public string? DayTitle { get; set; }
}

internal sealed class RawTripStop
{
    public long TripDayId { get; set; }
    public int VisitOrder { get; set; }
    public TimeSpan? PlannedTime { get; set; }
    public string? Note { get; set; }
    public string PlaceName { get; set; } = string.Empty;
    public string? PlaceAddress { get; set; }
    public string? PlaceDescription { get; set; }
}
