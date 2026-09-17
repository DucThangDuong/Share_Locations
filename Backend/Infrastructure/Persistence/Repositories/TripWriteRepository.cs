using Domain.Entities;
using Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class TripWriteRepository : ITripWriteRepository
{
    private readonly TravelReviewDbContext _dbContext;

    public TripWriteRepository(TravelReviewDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Trip?> GetByIdAsync(long id, CancellationToken ct = default)
    {
        return await _dbContext.Trips
            .FirstOrDefaultAsync(t => t.Id == id, ct);
    }

    public async Task<Trip?> GetByIdWithDetailsAsync(long id, CancellationToken ct = default)
    {
        return await _dbContext.Trips
            .Include(t => t.Days)
                .ThenInclude(d => d.Places)
            .Include(t => t.Members)
            .FirstOrDefaultAsync(t => t.Id == id, ct);
    }

    public async Task AddAsync(Trip trip, CancellationToken ct = default)
    {
        await _dbContext.Trips.AddAsync(trip, ct);
    }

    public void Remove(Trip trip)
    {
        _dbContext.Trips.Remove(trip);
    }

    public async Task<TripDay?> GetDayByIdAsync(long dayId, CancellationToken ct = default)
    {
        return await _dbContext.TripDays
            .FirstOrDefaultAsync(d => d.Id == dayId, ct);
    }

    public async Task<TripDay?> GetDayByTripAndNumberAsync(long tripId, int dayNumber, CancellationToken ct = default)
    {
        return await _dbContext.TripDays
            .FirstOrDefaultAsync(d => d.TripId == tripId && d.DayNumber == dayNumber, ct);
    }

    public async Task<List<TripDay>> GetDaysByTripIdAsync(long tripId, CancellationToken ct = default)
    {
        return await _dbContext.TripDays
            .Where(d => d.TripId == tripId)
            .OrderBy(d => d.DayNumber)
            .ToListAsync(ct);
    }

    public async Task AddDayAsync(TripDay day, CancellationToken ct = default)
    {
        await _dbContext.TripDays.AddAsync(day, ct);
    }

    public void RemoveDay(TripDay day)
    {
        _dbContext.TripDays.Remove(day);
    }

    public async Task<TripPlace?> GetPlaceByIdAsync(long tripPlaceId, CancellationToken ct = default)
    {
        return await _dbContext.TripPlaces
            .FirstOrDefaultAsync(p => p.Id == tripPlaceId, ct);
    }

    public async Task<TripPlace?> GetPlaceWithDayAndTripByIdAsync(long tripPlaceId, CancellationToken ct = default)
    {
        return await _dbContext.TripPlaces
            .Include(p => p.TripDay)
                .ThenInclude(d => d.Trip)
            .FirstOrDefaultAsync(p => p.Id == tripPlaceId, ct);
    }

    public async Task AddPlaceAsync(TripPlace tripPlace, CancellationToken ct = default)
    {
        await _dbContext.TripPlaces.AddAsync(tripPlace, ct);
    }

    public void RemovePlace(TripPlace tripPlace)
    {
        _dbContext.TripPlaces.Remove(tripPlace);
    }

    public async Task<List<TripPlace>> GetPlacesByDayIdAsync(long tripDayId, CancellationToken ct = default)
    {
        return await _dbContext.TripPlaces
            .Where(p => p.TripDayId == tripDayId)
            .OrderBy(p => p.VisitOrder)
            .ToListAsync(ct);
    }

    public async Task<TripMember?> GetMemberAsync(long tripId, long userId, CancellationToken ct = default)
    {
        return await _dbContext.TripMembers
            .FirstOrDefaultAsync(m => m.TripId == tripId && m.UserId == userId, ct);
    }

    public async Task AddMemberAsync(TripMember member, CancellationToken ct = default)
    {
        await _dbContext.TripMembers.AddAsync(member, ct);
    }

    public void RemoveMember(TripMember member)
    {
        _dbContext.TripMembers.Remove(member);
    }
}
