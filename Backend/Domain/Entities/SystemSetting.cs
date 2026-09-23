namespace Domain.Entities;

public class SystemSetting
{
    public int Id { get; private set; }
    public string SettingKey { get; private set; } = string.Empty;
    public string SettingValue { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public string SettingGroup { get; private set; } = "GENERAL";
    public DateTime UpdatedAt { get; private set; }
    public long? UpdatedBy { get; private set; }

    // Navigation
    public virtual User? UpdatedByUser { get; private set; }

    protected SystemSetting() { }

    public SystemSetting(string settingKey, string settingValue, string? description = null, string settingGroup = "GENERAL", long? updatedBy = null)
    {
        if (string.IsNullOrWhiteSpace(settingKey))
            throw new ArgumentException("Khóa cài đặt không được để trống.", nameof(settingKey));

        SettingKey = settingKey.Trim().ToUpperInvariant();
        SettingValue = settingValue;
        Description = description?.Trim();
        SettingGroup = string.IsNullOrWhiteSpace(settingGroup) ? "GENERAL" : settingGroup.Trim().ToUpperInvariant();
        UpdatedAt = DateTime.UtcNow;
        UpdatedBy = updatedBy;
    }

    public void UpdateValue(string settingValue, long? updatedBy = null, string? description = null)
    {
        SettingValue = settingValue;
        UpdatedBy = updatedBy;
        if (description != null)
            Description = description.Trim();
        UpdatedAt = DateTime.UtcNow;
    }
}
