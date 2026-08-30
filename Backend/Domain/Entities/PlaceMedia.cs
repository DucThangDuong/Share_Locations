using Domain.Enums;

namespace Domain.Entities;

public class PlaceMedia
{
    public long Id { get; private set; }
    public long PlaceId { get; private set; }
    public long? UploadedBy { get; private set; }
    public MediaType MediaType { get; private set; } = MediaType.Image;
    public string Url { get; private set; } = string.Empty;
    public int DisplayOrder { get; private set; }
    public bool IsVerified { get; private set; } = true;
    public DateTime CreatedAt { get; private set; }

    // Navigation
    public virtual Place Place { get; private set; } = null!;
    public virtual User? Uploader { get; private set; }
}
