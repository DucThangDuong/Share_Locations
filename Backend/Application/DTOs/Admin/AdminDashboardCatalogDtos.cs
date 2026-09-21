namespace Application.DTOs.Admin;

public class AdminDashboardSummaryDto
{
    public int TotalPlaces { get; set; }
    public int NewProposalsPending { get; set; }
    public int UnresolvedReports { get; set; }
    public int UrgentSlaBreached { get; set; }
    public int TotalReviews { get; set; }
    public int ReportedReviews { get; set; }
    public int TotalFoods { get; set; }
    public int TotalBlogs { get; set; }
}

public class AdminProvinceStatDto
{
    public string Province { get; set; } = string.Empty;
    public int PlacesCount { get; set; }
    public int Completeness { get; set; } // Percentage e.g. 85%
}

public class AdminDashboardMetricsDto
{
    public AdminDashboardSummaryDto Summary { get; set; } = new();
    public List<AdminProvinceStatDto> ProvinceStats { get; set; } = new();
}

public class AdminProvinceCompletenessDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int PlacesCount { get; set; }
    public int FoodsCount { get; set; }
    public int CompletenessPercent { get; set; }
}

public class AdminCategoryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? IconUrl { get; set; }
    public int DisplayOrder { get; set; }
}
