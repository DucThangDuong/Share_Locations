using Application.DTOs.Admin;

namespace Application.Common.Interfaces.Repositories;

public interface IAdminSystemConfigRepository
{
    // === REPORT TYPES ===
    Task<IReadOnlyList<AdminReportTypeListItemDto>> GetReportTypesAsync(string? targetScope = null, bool? activeOnly = null, CancellationToken ct = default);
    Task<AdminReportTypeListItemDto?> GetReportTypeByIdAsync(int id, CancellationToken ct = default);
    Task<int> CreateReportTypeAsync(CreateAdminReportTypeRequest input, long adminId, CancellationToken ct = default);
    Task<bool> UpdateReportTypeAsync(int id, UpdateAdminReportTypeRequest input, long adminId, CancellationToken ct = default);
    Task<bool> UpdateReportTypeStatusAsync(int id, bool isActive, long adminId, CancellationToken ct = default);
    Task<(bool Success, string? ErrorMessage)> DeleteReportTypeAsync(int id, long adminId, CancellationToken ct = default);

    // === SYSTEM SETTINGS ===
    Task<IReadOnlyList<AdminSystemSettingDto>> GetSystemSettingsAsync(string? group = null, CancellationToken ct = default);
    Task<AdminSystemSettingDto?> GetSystemSettingByKeyAsync(string key, CancellationToken ct = default);
    Task<bool> UpdateSystemSettingAsync(string key, string value, string? description, long adminId, CancellationToken ct = default);
    Task<int> BatchUpdateSystemSettingsAsync(Dictionary<string, string> settings, long adminId, CancellationToken ct = default);
}
