using Domain.Constants;

namespace Application.DTOs.Admin;

public class AdminReportTypeListItemDto
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string TargetScope { get; set; } = "ALL";
    public string TargetScopeName => AdminDisplayNames.GetTargetScopeName(TargetScope);
    public bool IsActive { get; set; }
    public int DisplayOrder { get; set; }
    public int TotalReportsCount { get; set; }
}

public class CreateAdminReportTypeRequest
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string TargetScope { get; set; } = "ALL";
    public bool IsActive { get; set; } = true;
    public int DisplayOrder { get; set; } = 0;
}

public class UpdateAdminReportTypeRequest
{
    public string Name { get; set; } = string.Empty;
    public string TargetScope { get; set; } = "ALL";
    public bool IsActive { get; set; } = true;
    public int DisplayOrder { get; set; }
}

public class AdminSystemSettingDto
{
    private string? _description;

    public int Id { get; set; }
    public string SettingKey { get; set; } = string.Empty;
    public string SettingName => AdminDisplayNames.GetSettingName(SettingKey);
    public string SettingValue { get; set; } = string.Empty;
    public string SettingGroup { get; set; } = "GENERAL";
    public string SettingGroupName => AdminDisplayNames.GetSettingGroupName(SettingGroup);
    public string? Description 
    { 
        get => AdminDisplayNames.StripParentheses(_description); 
        set => _description = value; 
    }
    public DateTime UpdatedAt { get; set; }
    public long? UpdatedBy { get; set; }
    public string? UpdatedByName { get; set; }
}

public class UpdateAdminSystemSettingRequest
{
    public string SettingValue { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class BatchUpdateSystemSettingsRequest
{
    public Dictionary<string, string> Settings { get; set; } = new();
}
