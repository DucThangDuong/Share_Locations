using Application.Common;
using Application.DTOs.Admin;
using Domain.Enums;

namespace Application.Common.Interfaces.Repositories;

public interface IAdminPlaceRepository
{
    Task<PagedResult<AdminPlaceListItemDto>> GetAdminPlacesAsync(
        int? provinceId,
        int? categoryId,
        int? status,
        string? keyword,
        int page,
        int pageSize,
        CancellationToken ct = default);

    Task<AdminPlaceDetailDto?> GetAdminPlaceDetailAsync(long id, CancellationToken ct = default);
    Task<long> CreateAdminPlaceAsync(CreateAdminPlaceInput input, long? creatorId, CancellationToken ct = default);
    Task<bool> UpdateAdminPlaceAsync(long id, UpdateAdminPlaceInput input, CancellationToken ct = default);
    Task<bool> UpdateAdminPlaceStatusAsync(long id, PlaceStatus status, CancellationToken ct = default);
    Task<bool> DeleteAdminPlaceAsync(long id, CancellationToken ct = default);
}
