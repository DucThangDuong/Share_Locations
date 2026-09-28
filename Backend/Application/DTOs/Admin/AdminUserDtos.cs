namespace Application.DTOs.Admin;

public class AdminUserListItemDto
{
    public long Id { get; set; }
    public long UserId
    {
        get => Id;
        set => Id = value;
    }
    public string Email { get; set; } = string.Empty;
    public string? FullName { get; set; }
    public string? AvatarUrl { get; set; }
    public string? PhoneNumber { get; set; }
    public byte Status { get; set; }
    public string StatusName => Status switch
    {
        1 => "Active",
        2 => "Inactive",
        3 => "Banned",
        _ => "Unknown"
    };
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public List<string> Roles { get; set; } = new();
    
    // Counts across system
    public int CategoryAdminsCount { get; set; }
    public int SystemAdminsCount { get; set; }
    public int RegularUsersCount { get; set; }

    // Scopes names conforming to Frontend SPEC
    public List<AdminScopeCategoryDto> CategoryScopes { get; set; } = new();
    public List<AdminScopeProvinceDto> ProvinceScopes { get; set; } = new();
    public List<AdminScopeRegionDto> RegionScopes { get; set; } = new();

    // Alias properties for backwards compatibility
    public List<AdminScopeCategoryDto> ManagedCategories
    {
        get => CategoryScopes;
        set => CategoryScopes = value;
    }
    public List<AdminScopeProvinceDto> ManagedProvinces
    {
        get => ProvinceScopes;
        set => ProvinceScopes = value;
    }
    public List<AdminScopeRegionDto> ManagedRegions
    {
        get => RegionScopes;
        set => RegionScopes = value;
    }
}

public class AdminUserDetailDto
{
    public long Id { get; set; }
    public long UserId
    {
        get => Id;
        set => Id = value;
    }
    public string Email { get; set; } = string.Empty;
    public string? FullName { get; set; }
    public string? PhoneNumber { get; set; }
    public string? AvatarUrl { get; set; }
    public string? CoverUrl { get; set; }
    public string? Bio { get; set; }
    public byte Status { get; set; }
    public string RankLevel { get; set; } = "Tân binh";
    public int ReputationScore { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public List<string> Roles { get; set; } = new();

    // Admin Level 1 scopes
    public List<AdminScopeCategoryDto> CategoryScopes { get; set; } = new();
    public List<AdminScopeProvinceDto> ProvinceScopes { get; set; } = new();
    public List<AdminScopeRegionDto> RegionScopes { get; set; } = new();

    // Activity statistics for Admin
    public AdminStatisticsDto? Statistics { get; set; }
}

public class AdminStatisticsDto
{
    public int TotalApprovedPlaces { get; set; }
    public int TotalModeratedReviews { get; set; }
    public int TotalHandledReports { get; set; }
}

public class AdminScopeCategoryDto
{
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
}

public class AdminScopeProvinceDto
{
    public int ProvinceId { get; set; }
    public string ProvinceName { get; set; } = string.Empty;
}

public class AdminScopeRegionDto
{
    public int RegionId { get; set; }
    public string RegionName { get; set; } = string.Empty;
}

public class UpdateAdminScopesRequest
{
    public List<int> CategoryIds { get; set; } = new();
    public List<int> ProvinceIds { get; set; } = new();
    public List<int>? RegionIds { get; set; }
    public string? Note { get; set; }
}

public class UpdateAdminScopesResponseDto
{
    public long UserId { get; set; }
    public int UpdatedCategoryCount { get; set; }
    public int UpdatedProvinceCount { get; set; }
    public int UpdatedRegionCount { get; set; }
}

public class UpdateUserStatusRequest
{
    public string Status { get; set; } = "1"; // "1": Active, "0": Locked/Banned
    public string? Reason { get; set; }
}

public class UserActivitiesDto
{
    public List<UserReviewActivityDto> Reviews { get; set; } = new();
    public List<UserBlogActivityDto> Blogs { get; set; } = new();
    public List<UserTripActivityDto> Trips { get; set; } = new();
    public List<UserProposalActivityDto> Proposals { get; set; } = new();
}

public class UserReviewActivityDto
{
    public long Id { get; set; }
    public long PlaceId { get; set; }
    public string PlaceName { get; set; } = string.Empty;
    public string? Category { get; set; }
    public string? Province { get; set; }
    public int Rating { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public int Likes { get; set; }
    public string Status { get; set; } = "active";
}

public class UserBlogActivityDto
{
    public long Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Category { get; set; }
    public int Views { get; set; }
    public int Likes { get; set; }
    public DateTime? PublishedAt { get; set; }
    public string Status { get; set; } = "published";
}

public class UserTripActivityDto
{
    public long Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Duration { get; set; }
    public int PlacesCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public string Status { get; set; } = "public";
}

public class UserProposalActivityDto
{
    public long Id { get; set; }
    public string PlaceName { get; set; } = string.Empty;
    public string? Category { get; set; }
    public string? Province { get; set; }
    public DateTime SubmittedAt { get; set; }
    public int Status { get; set; }
}

public class AdminAccessHistoryItemDto
{
    public string LogId { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string? TargetType { get; set; }
    public long TargetId { get; set; }
    public string? TargetName { get; set; }
    public string? Category { get; set; }
    public string? Province { get; set; }
    public DateTime Timestamp { get; set; }
    public string Result { get; set; } = "Thành công";
    public string? IpAddress { get; set; }
}

public class AdminAccessHistoryResultDto
{
    public List<AdminAccessHistoryItemDto> Items { get; set; } = new();
    public int Total { get; set; }
}
