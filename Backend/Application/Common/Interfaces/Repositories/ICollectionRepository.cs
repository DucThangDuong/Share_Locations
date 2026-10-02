using Application.Common;
using Application.DTOs;

namespace Application.Common.Interfaces.Repositories;

public interface ICollectionRepository
{
    Task<IReadOnlyList<CollectionDto>> GetFeaturedCollectionsAsync(int count = 6, CancellationToken ct = default);

    Task<IReadOnlyList<AdminCollectionSummaryDto>> GetAdminCollectionsAsync(CancellationToken ct = default);

    Task<Result<AdminCollectionDetailPlacesDto>> GetCollectionPlacesDetailAsync(int collectionId, CancellationToken ct = default);

    Task<Result<UpdateCollectionPlacesResultDto>> AddOrUpdatePlacesAsync(
        int collectionId,
        IReadOnlyList<CollectionPlaceInputDto> places,
        bool replaceExisting = false,
        string? description = null,
        int? provinceId = null,
        string? title = null,
        CancellationToken ct = default);

    Task<Result<AdminCollectionCreatedDto>> CreateCollectionAsync(
        string title,
        string? description,
        int? provinceId,
        string? coverUrl,
        int? displayOrder,
        bool isFeatured,
        int? status,
        IReadOnlyList<CollectionPlaceInputDto>? places,
        CancellationToken ct = default);

    Task<Result<UpdateCollectionStatusResultDto>> UpdateStatusAsync(
        int id,
        int status,
        CancellationToken ct = default);
}
