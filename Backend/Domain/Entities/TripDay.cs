namespace Domain.Entities;

public class TripDay
{
    public long Id { get; private set; }
    public long TripId { get; private set; }
    public int DayNumber { get; private set; }
    public string? DayTitle { get; private set; }
    public DateOnly? Date { get; private set; }

    public virtual Trip Trip { get; private set; } = null!;

    private readonly List<TripPlace> _places = new();
    public virtual IReadOnlyCollection<TripPlace> Places => _places.AsReadOnly();

    protected TripDay() { }

    public TripDay(long tripId, int dayNumber, string? dayTitle = null, DateOnly? date = null)
    {
        if (dayNumber < 1)
            throw new ArgumentOutOfRangeException(nameof(dayNumber), "Số thứ tự ngày phải lớn hơn hoặc bằng 1.");

        TripId = tripId;
        DayNumber = dayNumber;
        DayTitle = dayTitle?.Trim();
        Date = date;
    }

    public void UpdateTitle(string? dayTitle)
    {
        DayTitle = dayTitle?.Trim();
    }

    public void UpdateDate(DateOnly? date)
    {
        Date = date;
    }

    public void UpdateDayNumber(int dayNumber)
    {
        if (dayNumber < 1)
            throw new ArgumentOutOfRangeException(nameof(dayNumber), "Số thứ tự ngày phải lớn hơn hoặc bằng 1.");
        DayNumber = dayNumber;
    }

    public void UpdateInfo(string? dayTitle, DateOnly? date)
    {
        DayTitle = dayTitle?.Trim();
        Date = date;
    }
}
