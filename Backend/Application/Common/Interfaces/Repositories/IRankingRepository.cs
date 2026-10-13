using Application.DTOs;

namespace Application.Common.Interfaces.Repositories;

public interface IRankingRepository
{
    Task<RankingOverviewDto> GetRankingOverviewAsync(CancellationToken ct = default);

    Task<RankingDetailViewDto> GetRankingDetailAsync(
        string type,
        int? placeTypeId,
        int? provinceId,
        int? categoryId,
        int page = 1,
        int pageSize = 10,
        CancellationToken ct = default);

    Task<IReadOnlyList<PlaceRankingItemDto>> GetPlaceRankingsAsync(
        int? placeTypeId = null,
        int? categoryId = null,
        int? provinceId = null,
        int? regionId = null,
        string period = "all_time",
        int limit = 10,
        CancellationToken ct = default);

    Task<IReadOnlyList<ProvinceRankingItemDto>> GetProvinceRankingsAsync(
        int? regionId = null,
        int limit = 10,
        CancellationToken ct = default);

    Task<IReadOnlyList<DestinationRankingItemDto>> GetDestinationRankingsAsync(
        int? regionId = null,
        int? categoryId = null,
        int limit = 10,
        CancellationToken ct = default);
}
