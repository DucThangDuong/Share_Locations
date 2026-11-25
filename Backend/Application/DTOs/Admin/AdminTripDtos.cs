namespace Application.DTOs.Admin;

public class AdminTripListItemDto
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
    public string PrivacyText { get; set; } = string.Empty;
    public byte Status { get; set; }
    public string StatusText { get; set; } = string.Empty;
    public int ViewCount { get; set; }
    public int CloneCount { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class AdminTripDetailDto : AdminTripListItemDto
{
    public List<AdminTripDayDto> Days { get; set; } = new();
    public List<AdminTripMemberDto> Members { get; set; } = new();
}

public class AdminTripDayDto
{
    public long Id { get; set; }
    public int DayNumber { get; set; }
    public string? DayTitle { get; set; }
    public DateOnly? Date { get; set; }
    public List<AdminTripStopDto> Stops { get; set; } = new();
}

public class AdminTripStopDto
{
    public long Id { get; set; }
    public long PlaceId { get; set; }
    public string PlaceName { get; set; } = string.Empty;
    public string? CategoryName { get; set; }
    public string? ProvinceName { get; set; }
    public string? Address { get; set; }
    public string? CoverImageUrl { get; set; }
    public int VisitOrder { get; set; }
    public string? StartTime { get; set; }
    public string? EndTime { get; set; }
    public decimal? EstimatedCost { get; set; }
    public string? TransportMode { get; set; }
    public string? Note { get; set; }
}

public class AdminTripMemberDto
{
    public long UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? AvatarUrl { get; set; }
    public string Role { get; set; } = string.Empty;
    public DateTime JoinedAt { get; set; }
}

public class AdminTripStopInput
{
    public long PlaceId { get; set; }
    public int VisitOrder { get; set; }
    public string? StartTime { get; set; }
    public string? EndTime { get; set; }
    public decimal? EstimatedCost { get; set; }
    public string? TransportMode { get; set; }
    public string? Note { get; set; }
}

public class AdminTripDayInput
{
    public int DayNumber { get; set; }
    public string? DayTitle { get; set; }
    public DateOnly? Date { get; set; }
    public List<AdminTripStopInput>? Stops { get; set; }
}

public class CreateAdminTripInput
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? CoverImageUrl { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public decimal? EstimatedBudget { get; set; }
    public byte Privacy { get; set; } = 0;
    public byte Status { get; set; } = 0;
    public List<AdminTripDayInput>? Days { get; set; }
}

public class UpdateAdminTripInput
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? CoverImageUrl { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public decimal? EstimatedBudget { get; set; }
    public byte Privacy { get; set; } = 0;
    public byte Status { get; set; } = 0;
    public bool ReplaceSchedule { get; set; } = true;
    public List<AdminTripDayInput>? Days { get; set; }
}

public class UpdateAdminTripPrivacyInput
{
    public byte Privacy { get; set; }
    public string? Reason { get; set; }
}

public class UpdateAdminTripStatusInput
{
    public byte Status { get; set; }
    public string? Reason { get; set; }
}
