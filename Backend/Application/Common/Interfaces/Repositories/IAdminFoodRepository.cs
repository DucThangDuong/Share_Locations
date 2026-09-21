using Application.Common;
using Application.DTOs.Admin;

namespace Application.Common.Interfaces.Repositories;

public interface IAdminFoodRepository
{
    Task<PagedResult<AdminFoodItemDto>> GetAdminFoodsAsync(
        int? provinceId,
        string? status,
        string? keyword,
        int page,
        int pageSize,
        CancellationToken ct = default);

    Task<long> CreateAdminFoodAsync(CreateAdminFoodInput input, CancellationToken ct = default);
    Task<bool> UpdateAdminFoodAsync(long id, UpdateAdminFoodInput input, CancellationToken ct = default);
    Task<bool> UpdateAdminFoodStatusAsync(long id, string status, CancellationToken ct = default);
    Task<bool> DeleteAdminFoodAsync(long id, CancellationToken ct = default);
}
