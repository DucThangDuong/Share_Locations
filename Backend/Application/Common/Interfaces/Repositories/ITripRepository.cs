using Application.DTOs;

namespace Application.Common.Interfaces.Repositories;

public interface ITripRepository
{
    Task<IReadOnlyList<ItineraryDto>> GetItinerariesAsync(
        string? duration,
        string? region,
        string? keyword,
        int page,
        int pageSize,
        CancellationToken ct = default);

    Task<bool> IsItinerarySavedAsync(
        long userId,
        long tripId,
        CancellationToken ct = default);
}
