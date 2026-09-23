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
    public bool IsVerified { get; private set; } = false;
    public long? ReviewedBy { get; private set; }
    public DateTime? ReviewedAt { get; private set; }
    public DateTime CreatedAt { get; private set; }

    // Navigation
    public virtual Place Place { get; private set; } = null!;
    public virtual User? Uploader { get; private set; }
    public virtual User? ReviewerAdmin { get; private set; }

    protected PlaceMedia() { }

    public PlaceMedia(long placeId, string url, MediaType mediaType = MediaType.Image, int displayOrder = 0, long? uploadedBy = null, bool isVerified = false)
    {
        PlaceId = placeId;
        Url = url;
        MediaType = mediaType;
        DisplayOrder = displayOrder;
        UploadedBy = uploadedBy;
        IsVerified = isVerified;
        CreatedAt = DateTime.UtcNow;
    }

    public void Verify(long? reviewerId = null)
    {
        IsVerified = true;
        ReviewedBy = reviewerId;
        ReviewedAt = DateTime.UtcNow;
    }
}
