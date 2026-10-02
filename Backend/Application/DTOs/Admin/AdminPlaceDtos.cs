namespace Application.DTOs.Admin;

public class AdminPlaceListItemDto
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public string Province { get; set; } = string.Empty;
    public int ProvinceId { get; set; }
    public string Location { get; set; } = string.Empty;
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public string? Hours { get; set; }
    public string? Phone { get; set; }
    public string? Website { get; set; }
    public int StatusNum { get; set; } // 0: Pending, 1: Approved, 2: Rejected, 3: Hidden
    public string Status => StatusNum switch
    {
        0 => "Chờ duyệt",
        1 => "Đã duyệt",
        2 => "Đã từ chối",
        3 => "Tạm ẩn",
        _ => "Không xác định"
    };
    public decimal Rating { get; set; }
    public int ReviewsCount { get; set; }
    public string? Img { get; set; }

    // Frontend compatibility aliases
    public string Address
    {
        get => Location;
        set => Location = value;
    }
    public string CategoryName
    {
        get => Category;
        set => Category = value;
    }
    public string ProvinceName
    {
        get => Province;
        set => Province = value;
    }
    public string? CoverImg
    {
        get => Img;
        set => Img = value;
    }
}

public class AdminPlaceDetailDto : AdminPlaceListItemDto
{
    public string? Description { get; set; }
    public List<string> Photos { get; set; } = new();
    public List<string> Images
    {
        get => Photos;
        set => Photos = value;
    }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateAdminPlaceInput
{
    public string Name { get; set; } = string.Empty;
    public int ProvinceId { get; set; }
    public int CategoryId { get; set; }

    private string _address = string.Empty;
    public string Address
    {
        get => _address;
        set => _address = value;
    }
    public string Location
    {
        get => _address;
        set => _address = !string.IsNullOrWhiteSpace(value) ? value : _address;
    }

    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }

    private string? _hours;
    public string? Hours
    {
        get => _hours;
        set => _hours = value;
    }
    public string? OpeningHours
    {
        get => _hours;
        set => _hours = value ?? _hours;
    }

    public string? Phone { get; set; }
    public string? Website { get; set; }

    private string? _description;
    public string? Description
    {
        get => _description;
        set => _description = value;
    }
    public string? Desc
    {
        get => _description;
        set => _description = value ?? _description;
    }

    private string? _primaryImageUrl;
    public string? PrimaryImageUrl
    {
        get => _primaryImageUrl;
        set => _primaryImageUrl = value;
    }
    public string? CoverImg
    {
        get => _primaryImageUrl;
        set => _primaryImageUrl = value ?? _primaryImageUrl;
    }
    public string? Img
    {
        get => _primaryImageUrl;
        set => _primaryImageUrl = value ?? _primaryImageUrl;
    }

    private List<string>? _photos;
    public List<string>? Photos
    {
        get => _photos;
        set => _photos = value;
    }
    public List<string>? Images
    {
        get => _photos;
        set => _photos = value ?? _photos;
    }
    public List<string>? MediaUrls
    {
        get => _photos;
        set => _photos = value ?? _photos;
    }

    public bool AutoApprove { get; set; } = true;
}

public class UpdateAdminPlaceInput
{
    public string? Name { get; set; }
    public int? ProvinceId { get; set; }
    public int? CategoryId { get; set; }

    private string? _address;
    public string? Address
    {
        get => _address;
        set => _address = value;
    }
    public string? Location
    {
        get => _address;
        set => _address = !string.IsNullOrWhiteSpace(value) ? value : _address;
    }

    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }

    private string? _hours;
    public string? Hours
    {
        get => _hours;
        set => _hours = value;
    }
    public string? OpeningHours
    {
        get => _hours;
        set => _hours = value ?? _hours;
    }

    public string? Phone { get; set; }
    public string? Website { get; set; }

    private string? _description;
    public string? Description
    {
        get => _description;
        set => _description = value;
    }
    public string? Desc
    {
        get => _description;
        set => _description = value ?? _description;
    }

    private string? _primaryImageUrl;
    public string? PrimaryImageUrl
    {
        get => _primaryImageUrl;
        set => _primaryImageUrl = value;
    }
    public string? CoverImg
    {
        get => _primaryImageUrl;
        set => _primaryImageUrl = value ?? _primaryImageUrl;
    }
    public string? Img
    {
        get => _primaryImageUrl;
        set => _primaryImageUrl = value ?? _primaryImageUrl;
    }

    private List<string>? _photos;
    public List<string>? Photos
    {
        get => _photos;
        set => _photos = value;
    }
    public List<string>? Images
    {
        get => _photos;
        set => _photos = value ?? _photos;
    }
    public List<string>? MediaUrls
    {
        get => _photos;
        set => _photos = value ?? _photos;
    }
}

public class UpdatePlaceStatusInput
{
    public int StatusNum { get; set; } // 1: Approved, 3: Hidden, 0: Pending, 2: Rejected
    public string? Reason { get; set; }
}

public class PlaceMediaItemDto
{
    public long Id { get; set; }
    public long PlaceId { get; set; }
    public string Url { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public bool IsVerified { get; set; }
    public DateTime CreatedAt { get; set; }
}

