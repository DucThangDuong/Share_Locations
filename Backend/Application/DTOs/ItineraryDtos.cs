namespace Application.DTOs;

public class ItineraryAuthorDto
{
    public string Name { get; set; } = string.Empty;
    public string? Avatar { get; set; }
}

public class ItineraryStopDto
{
    public string Time { get; set; } = string.Empty;
    public string Activity { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? CostEstimate { get; set; }
    public string? Tips { get; set; }
}

public class ItineraryDayDto
{
    public int DayNumber { get; set; }
    public string Title { get; set; } = string.Empty;
    public IReadOnlyList<ItineraryStopDto> Stops { get; set; } = [];
}

public class ItineraryDto
{
    public long Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Destination { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
    public string Duration { get; set; } = string.Empty;
    public int DaysCount { get; set; }
    public string Style { get; set; } = string.Empty;
    public string EstimatedCost { get; set; } = string.Empty;
    public string? CoverUrl { get; set; }
    public ItineraryAuthorDto Author { get; set; } = new();
    public string? Overview { get; set; }
    public IReadOnlyList<ItineraryDayDto> Days { get; set; } = [];
}

public class SaveItineraryResponseDto
{
    public bool Saved { get; set; }
    public long ItineraryId { get; set; }
}
