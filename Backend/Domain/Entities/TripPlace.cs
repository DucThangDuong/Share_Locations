namespace Domain.Entities;

public class TripPlace
{
    public long Id { get; private set; }
    public long TripDayId { get; private set; }
    public long PlaceId { get; private set; }
    public int VisitOrder { get; private set; }
    public TimeOnly? PlannedTime { get; private set; }
    public string? Note { get; private set; }

    // Navigation
    public virtual TripDay TripDay { get; private set; } = null!;
    public virtual Place Place { get; private set; } = null!;
}
