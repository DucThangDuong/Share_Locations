namespace Domain.Entities;

public class TripPlace
{
    public long Id { get; private set; }
    public long TripDayId { get; private set; }
    public long PlaceId { get; private set; }
    public int VisitOrder { get; private set; }
    public TimeOnly? StartTime { get; private set; }
    public TimeOnly? EndTime { get; private set; }
    public decimal? EstimatedCost { get; private set; }
    public string? TransportMode { get; private set; }
    public string? Note { get; private set; }

    // Navigation
    public virtual TripDay TripDay { get; private set; } = null!;
    public virtual Place Place { get; private set; } = null!;

    protected TripPlace() { }

    public TripPlace(
        long tripDayId,
        long placeId,
        int visitOrder = 0,
        TimeOnly? startTime = null,
        TimeOnly? endTime = null,
        decimal? estimatedCost = null,
        string? transportMode = null,
        string? note = null)
    {
        if (startTime.HasValue && endTime.HasValue && endTime < startTime)
            throw new ArgumentException("Thời gian kết thúc không được trước thời gian bắt đầu.");

        TripDayId = tripDayId;
        PlaceId = placeId;
        VisitOrder = visitOrder;
        StartTime = startTime;
        EndTime = endTime;
        EstimatedCost = estimatedCost;
        TransportMode = transportMode?.Trim();
        Note = note?.Trim();
    }

    public void UpdateSchedule(
        int visitOrder,
        TimeOnly? startTime,
        TimeOnly? endTime,
        decimal? estimatedCost,
        string? transportMode,
        string? note)
    {
        if (startTime.HasValue && endTime.HasValue && endTime < startTime)
            throw new ArgumentException("Thời gian kết thúc không được trước thời gian bắt đầu.");

        VisitOrder = visitOrder;
        StartTime = startTime;
        EndTime = endTime;
        EstimatedCost = estimatedCost;
        TransportMode = transportMode?.Trim();
        Note = note?.Trim();
    }
}
