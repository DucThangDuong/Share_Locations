using Application.DTOs;

namespace Application.Common.Interfaces.Repositories;

public interface IPlaceRepository
{
    Task<(IReadOnlyList<PlaceSummaryDto> Items, long TotalCount)> SearchAndFilterAsync(
        PlaceFilterParams filterParams,
        CancellationToken ct = default);
}
