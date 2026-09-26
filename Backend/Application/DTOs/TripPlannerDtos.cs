namespace Application.DTOs;

public class UserTripSummaryDto
{
    public long Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? CoverImageUrl { get; set; }
    public string? Province { get; set; }
    public string? Region { get; set; }
    public string? StartDate { get; set; }
    public string? EndDate { get; set; }
    public int DurationDays { get; set; }
    public int NightsCount { get; set; }
    public decimal? EstimatedBudget { get; set; }
    public byte Privacy { get; set; }
    public byte Status { get; set; }
    public string UserRole { get; set; } = "Owner";
    public int MembersCount { get; set; }
    public int TotalStopsCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateTripRequestDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? CoverImageUrl { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public byte Privacy { get; set; } = 1;
    public long? SourceTripId { get; set; }
    public List<CreateTripDayDto>? Days { get; set; }
}

public class CreateTripDayDto
{
    public int DayNumber { get; set; }
    public string? DayTitle { get; set; }
    public DateOnly? Date { get; set; }
    public List<CreateTripStopDto>? Stops { get; set; }
}

public class CreateTripStopDto
{
    public long PlaceId { get; set; }
    public int VisitOrder { get; set; }
    public string? StartTime { get; set; }
    public string? EndTime { get; set; }
    public decimal? EstimatedCost { get; set; }
    public string? TransportMode { get; set; }
    public string? Note { get; set; }
}

public class CreateTripResponseDto
{
    public long Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public int DurationDays { get; set; }
    public int NightsCount { get; set; }
    public decimal? EstimatedBudget { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class TripDetailDto
{
    public long Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? CoverImageUrl { get; set; }
    public string? Province { get; set; }
    public string? Region { get; set; }
    public string? StartDate { get; set; }
    public string? EndDate { get; set; }
    public int DurationDays { get; set; }
    public int NightsCount { get; set; }
    public decimal? EstimatedBudget { get; set; }
    public decimal? BudgetTarget { get; set; }
    public byte Privacy { get; set; }
    public byte Status { get; set; }
    public string? CurrentUserRole { get; set; }
    public List<TripMemberDetailDto> Members { get; set; } = new();
    public List<TripDayDetailDto> Days { get; set; } = new();
}

public class TripMemberDetailDto
{
    public long UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string? Email { get; set; }
    public string Role { get; set; } = "Member";
}

public class TripDayDetailDto
{
    public long Id { get; set; }
    public int DayNumber { get; set; }
    public string? DayTitle { get; set; }
    public string? Date { get; set; }
    public List<TripPlaceDetailDto> Stops { get; set; } = new();
}

public class UpdateTripDayRequestDto
{
    public string? DayTitle { get; set; }
    public DateOnly? Date { get; set; }
}

public class AddTripDayRequestDto
{
    public string? DayTitle { get; set; }
    public DateOnly? Date { get; set; }
}

public class TripPlaceDetailDto
{
    public long Id { get; set; }
    public long PlaceId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Category { get; set; }
    public string? Address { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public int VisitOrder { get; set; }
    public string? StartTime { get; set; }
    public string? EndTime { get; set; }
    public decimal? EstimatedCost { get; set; }
    public string? TransportMode { get; set; }
    public string? Note { get; set; }
    public string? ImageUrl { get; set; }
}

public class UpdateTripRequestDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? CoverImageUrl { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public byte? Privacy { get; set; }
    public decimal? BudgetTarget { get; set; }
}

public class AddTripPlaceRequestDto
{
    public long PlaceId { get; set; }
    public int VisitOrder { get; set; }
    public string? StartTime { get; set; }
    public string? EndTime { get; set; }
    public decimal? EstimatedCost { get; set; }
    public string? TransportMode { get; set; }
    public string? Note { get; set; }
}

public class UpdateTripPlaceRequestDto
{
    public int VisitOrder { get; set; }
    public string? StartTime { get; set; }
    public string? EndTime { get; set; }
    public decimal? EstimatedCost { get; set; }
    public string? TransportMode { get; set; }
    public string? Note { get; set; }
}

public class InviteTripMemberRequestDto
{
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = "Member";
}

public class PublicTripSummaryDto
{
    public long Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Province { get; set; }
    public int DurationDays { get; set; }
    public int NightsCount { get; set; }
    public string? CoverImageUrl { get; set; }
}

public class PublishTripRequestDto
{
    public string Description { get; set; } = string.Empty;
    public string? Title { get; set; }
}

