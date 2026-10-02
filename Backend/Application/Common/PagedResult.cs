namespace Application.Common;

public class PagedResult<T>
{
    public IReadOnlyList<T> Items { get; }
    public int PageIndex { get; }
    public int PageSize { get; }
    public long TotalCount { get; }
    public int TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)TotalCount / PageSize) : 0;
    public int CategoryAdminsCount { get; set; }
    public int SystemAdminsCount { get; set; }
    public int RegularUsersCount { get; set; }
    public int PendingCount { get; set; }
    public int ApprovedCount { get; set; }
    public int RejectedCount { get; set; }

    public PagedResult(IReadOnlyList<T> items, long totalCount, int pageIndex, int pageSize)
    {
        Items = items;
        TotalCount = totalCount;
        PageIndex = pageIndex;
        PageSize = pageSize;
    }

    public PagedResult(
        IReadOnlyList<T> items,
        long totalCount,
        int pageIndex,
        int pageSize,
        int categoryAdminsCount,
        int systemAdminsCount,
        int regularUsersCount = 0)
        : this(items, totalCount, pageIndex, pageSize)
    {
        CategoryAdminsCount = categoryAdminsCount;
        SystemAdminsCount = systemAdminsCount;
        RegularUsersCount = regularUsersCount;
    }
}
