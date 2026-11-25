using Application.Common;
using Application.DTOs.Admin;

namespace Application.Common.Interfaces.Repositories;

public interface IAdminTripRepository
{
    Task<PagedResult<AdminTripListItemDto>> GetAdminTripsAsync(
        int? provinceId,
        byte? privacy,
        byte? status,
        string? keyword,
        int page,
        int pageSize,
        string? sortBy = null,
        string? sortOrder = null,
        CancellationToken ct = default);

    Task<AdminTripDetailDto?> GetAdminTripDetailAsync(long id, CancellationToken ct = default);
    Task<long> CreateAdminTripAsync(CreateAdminTripInput input, long authorId, CancellationToken ct = default);
    Task<bool> UpdateAdminTripAsync(long id, UpdateAdminTripInput input, CancellationToken ct = default);
    Task<bool> UpdateAdminTripPrivacyAsync(long id, byte privacy, string? reason, CancellationToken ct = default);
    Task<bool> UpdateAdminTripStatusAsync(long id, byte status, string? reason, CancellationToken ct = default);
    Task<bool> DeleteAdminTripAsync(long id, CancellationToken ct = default);
}
