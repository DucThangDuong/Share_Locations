using Application.Common;
using Application.DTOs;
using Domain.Enums;

namespace Application.Common.Interfaces.Repositories;

public interface ITripRepository
{
    Task<IReadOnlyList<ItineraryDto>> GetItinerariesAsync(
        ItineraryFilterParams filterParams,
        CancellationToken ct = default);

    Task<IReadOnlyList<ItineraryDto>> GetItinerariesAsync(
        string? duration,
        string? keyword,
        int page,
        int pageSize,
        CancellationToken ct = default);

    Task<bool> IsItinerarySavedAsync(
        long userId,
        long tripId,
        CancellationToken ct = default);

    Task<PagedResult<UserTripSummaryDto>> GetUserTripsAsync(
        long userId,
        string? status,
        int page,
        int pageSize,
        CancellationToken ct = default);

    Task<TripDetailDto?> GetTripDetailAsync(
        long tripId,
        long? currentUserId,
        CancellationToken ct = default);

    Task<IReadOnlyList<PublicTripSummaryDto>> GetUserPublicTripsAsync(
        long userId,
        CancellationToken ct = default);

    Task<TripMemberRole?> GetUserTripRoleAsync(
        long tripId,
        long userId,
        CancellationToken ct = default);

    Task<bool> IsUserMemberOrOwnerAsync(
        long tripId,
        long userId,
        CancellationToken ct = default);
}
