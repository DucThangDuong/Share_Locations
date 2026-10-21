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
    public int Completeness { get; set; }
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

public class DashboardTrendsResponseDto
{
    public string TimeRange { get; set; } = "7days";
    public List<DashboardTrendPointDto> Points { get; set; } = new();
}

public class DashboardTrendPointDto
{
    public string Timestamp { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public int ReviewsCount { get; set; }
    public int ReportsCount { get; set; }
}

public class SlaPerformanceResponseDto
{
    public ProposalApprovalRateDto ProposalsApprovalRate { get; set; } = new();
    public ReportsResolutionSlaDto ReportsResolutionSla { get; set; } = new();
    public PlacesDataQualityRateDto PlacesDataQualityRate { get; set; } = new();
}

public class ProposalApprovalRateDto
{
    public int Approved { get; set; }
    public int Total { get; set; }
    public double Percentage { get; set; }
    public int PendingInspection { get; set; }
}

public class ReportsResolutionSlaDto
{
    public int ResolvedWithinSla { get; set; }
    public int TotalReports { get; set; }
    public double Percentage { get; set; }
    public int OpenUnder24h { get; set; }
}

public class PlacesDataQualityRateDto
{
    public int QualifiedPlaces { get; set; }
    public int TotalPlaces { get; set; }
    public double Percentage { get; set; }
    public string MissingInfoSummary { get; set; } = string.Empty;
}

public class PriorityQueueItemDto
{
    public string Id { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public bool IsUrgent { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string LocationName { get; set; } = string.Empty;
    public string TimeAgo { get; set; } = string.Empty;
    public string BadgeLabel { get; set; } = string.Empty;
    public string TargetId { get; set; } = string.Empty;
}

public class ContributorsSummaryDto
{
    public int NewContributorsCount { get; set; }
    public string GrowthComparisonText { get; set; } = string.Empty;
    public List<TopActiveProvinceDto> TopActiveProvinces { get; set; } = new();
}

public class TopActiveProvinceDto
{
    public string ProvinceName { get; set; } = string.Empty;
    public double ActivityPercentage { get; set; }
}

