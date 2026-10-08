using Application.Common;
using Application.DTOs.Admin;

namespace Application.Common.Interfaces.Repositories;

public interface IAdminCatalogTaxonomyRepository
{
    Task<IReadOnlyList<AdminPlaceTypeListItemDto>> GetPlaceTypesAsync(bool? activeOnly = null, CancellationToken ct = default);
    Task<AdminPlaceTypeListItemDto?> GetPlaceTypeByIdAsync(int id, CancellationToken ct = default);
    Task<int> CreatePlaceTypeAsync(CreateAdminPlaceTypeRequest input, long adminId, CancellationToken ct = default);
    Task<bool> UpdatePlaceTypeAsync(int id, UpdateAdminPlaceTypeRequest input, long adminId, CancellationToken ct = default);
    Task<bool> UpdatePlaceTypeStatusAsync(int id, byte status, string? reason, long adminId, CancellationToken ct = default);

    Task<PagedResult<AdminCategoryTaxonomyListItemDto>> GetCategoriesAsync(
        int? placeTypeId,
        byte? status,
        string? keyword,
        int page,
        int pageSize,
        CancellationToken ct = default);
    Task<AdminCategoryTaxonomyListItemDto?> GetCategoryByIdAsync(int id, CancellationToken ct = default);
    Task<int> CreateCategoryAsync(CreateAdminCategoryRequest input, long adminId, CancellationToken ct = default);
    Task<bool> UpdateCategoryAsync(int id, UpdateAdminCategoryRequest input, long adminId, CancellationToken ct = default);
    Task<bool> UpdateCategoryStatusAsync(int id, byte status, string? reason, long adminId, CancellationToken ct = default);
}
