namespace Domain.Entities;

public class ReportType
{
    public int Id { get; private set; }
    public string Code { get; private set; } = string.Empty;
    public string Name { get; private set; } = string.Empty;
    public bool IsActive { get; private set; } = true;
    public int DisplayOrder { get; private set; }

    // Navigation
    private readonly List<PlaceReport> _placeReports = new();
    public virtual IReadOnlyCollection<PlaceReport> PlaceReports => _placeReports.AsReadOnly();

    private readonly List<ReviewReport> _reviewReports = new();
    public virtual IReadOnlyCollection<ReviewReport> ReviewReports => _reviewReports.AsReadOnly();

    private readonly List<CommentReport> _commentReports = new();
    public virtual IReadOnlyCollection<CommentReport> CommentReports => _commentReports.AsReadOnly();

    private readonly List<BlogReport> _blogReports = new();
    public virtual IReadOnlyCollection<BlogReport> BlogReports => _blogReports.AsReadOnly();

    protected ReportType() { }

    public ReportType(string code, string name, bool isActive = true, int displayOrder = 0)
    {
        Code = code;
        Name = name;
        IsActive = isActive;
        DisplayOrder = displayOrder;
    }
}
