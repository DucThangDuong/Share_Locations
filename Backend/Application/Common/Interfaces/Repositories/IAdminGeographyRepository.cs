using Application.Common;
using Application.DTOs.Admin;

namespace Application.Common.Interfaces.Repositories;

public interface IAdminGeographyRepository
{
    // === REGIONS ===
    Task<IReadOnlyList<AdminRegionListItemDto>> GetRegionsAsync(bool? activeOnly = null, CancellationToken ct = default);
    Task<AdminRegionListItemDto?> GetRegionByIdAsync(int id, CancellationToken ct = default);
    Task<int> CreateRegionAsync(CreateAdminRegionRequest input, long adminId, CancellationToken ct = default);
    Task<bool> UpdateRegionAsync(int id, UpdateAdminRegionRequest input, long adminId, CancellationToken ct = default);
    Task<bool> UpdateRegionStatusAsync(int id, byte status, string? reason, long adminId, CancellationToken ct = default);
    Task<(bool Success, string? ErrorMessage)> DeleteRegionAsync(int id, long adminId, CancellationToken ct = default);

    // === PROVINCES ===
    Task<PagedResult<AdminProvinceListItemDto>> GetProvincesAsync(
        int? regionId,
        byte? status,
        bool? featured,
        string? keyword,
        int page,
        int pageSize,
        CancellationToken ct = default);
    Task<AdminProvinceDetailDto?> GetProvinceByIdAsync(int id, CancellationToken ct = default);
    Task<int> CreateProvinceAsync(CreateAdminProvinceRequest input, long adminId, CancellationToken ct = default);
    Task<bool> UpdateProvinceAsync(int id, UpdateAdminProvinceRequest input, long adminId, CancellationToken ct = default);
    Task<bool> UpdateProvinceStatusAsync(int id, byte status, string? reason, long adminId, CancellationToken ct = default);
    Task<(bool Success, string? ErrorMessage)> DeleteProvinceAsync(int id, long adminId, CancellationToken ct = default);
}
