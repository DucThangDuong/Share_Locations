using Application.DTOs;

namespace Application.Common.Interfaces.Repositories;

public interface IPlaceRepository
{
    Task<PlaceFilterOptionsDto> GetFilterOptionsAsync(CancellationToken ct = default);

    Task<(IReadOnlyList<PlaceSummaryDto> Items, long TotalCount)> SearchAndFilterAsync(
        PlaceFilterParams filterParams,
        CancellationToken ct = default);

    Task<PlaceDetailDto?> GetPlaceDetailAsync(long id, CancellationToken ct = default);

    Task<IReadOnlyList<PlaceMapItemDto>> GetPlacesMapAsync(
        string? keyword,
        string? region,
        int? provinceId,
        int? categoryId,
        double? minLng,
        double? minLat,
        double? maxLng,
        double? maxLat,
        CancellationToken ct = default);

    Task<PlaceReviewSummaryDto> GetPlaceReviewsAsync(
        long placeId,
        int page,
        int pageSize,
        int? rating,
        CancellationToken ct = default);

    Task<ReviewItemDto> CreateReviewAsync(
        long placeId,
        long userId,
        byte rating,
        string content,
        List<string>? images,
        CancellationToken ct = default);

    Task<bool> CreatePlaceReportAsync(
        long placeId,
        string reason,
        string? description,
        string? contactEmail,
        long? reporterId,
        CancellationToken ct = default);

    Task<bool> ToggleSavePlaceAsync(
        long userId,
        long placeId,
        bool isSave,
        CancellationToken ct = default);

    Task<bool> IsPlaceSavedAsync(
        long userId,
        long placeId,
        CancellationToken ct = default);
}
