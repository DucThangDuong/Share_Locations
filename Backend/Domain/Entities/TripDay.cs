namespace Domain.Entities;

public class TripDay
{
    public long Id { get; private set; }
    public long TripId { get; private set; }
    public int DayNumber { get; private set; }
    public string? DayTitle { get; private set; }
    public DateOnly? Date { get; private set; }

    // Navigation
    public virtual Trip Trip { get; private set; } = null!;

    private readonly List<TripPlace> _places = new();
    public virtual IReadOnlyCollection<TripPlace> Places => _places.AsReadOnly();
}
