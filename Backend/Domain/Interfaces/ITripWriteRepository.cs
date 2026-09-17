using Domain.Entities;

namespace Domain.Interfaces;

public interface ITripWriteRepository
{
    Task<Trip?> GetByIdAsync(long id, CancellationToken ct = default);
    Task<Trip?> GetByIdWithDetailsAsync(long id, CancellationToken ct = default);
    Task AddAsync(Trip trip, CancellationToken ct = default);
    void Remove(Trip trip);

    Task<TripDay?> GetDayByIdAsync(long dayId, CancellationToken ct = default);
    Task<TripDay?> GetDayByTripAndNumberAsync(long tripId, int dayNumber, CancellationToken ct = default);
    Task<List<TripDay>> GetDaysByTripIdAsync(long tripId, CancellationToken ct = default);
    Task AddDayAsync(TripDay day, CancellationToken ct = default);
    void RemoveDay(TripDay day);

    Task<TripPlace?> GetPlaceByIdAsync(long tripPlaceId, CancellationToken ct = default);
    Task<TripPlace?> GetPlaceWithDayAndTripByIdAsync(long tripPlaceId, CancellationToken ct = default);
    Task AddPlaceAsync(TripPlace tripPlace, CancellationToken ct = default);
    void RemovePlace(TripPlace tripPlace);
    Task<List<TripPlace>> GetPlacesByDayIdAsync(long tripDayId, CancellationToken ct = default);

    Task<TripMember?> GetMemberAsync(long tripId, long userId, CancellationToken ct = default);
    Task AddMemberAsync(TripMember member, CancellationToken ct = default);
    void RemoveMember(TripMember member);
}
