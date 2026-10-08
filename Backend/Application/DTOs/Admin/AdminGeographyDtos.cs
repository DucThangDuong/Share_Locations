using Domain.Constants;

namespace Application.DTOs.Admin;

public class AdminRegionListItemDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? Tagline { get; set; }
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public int OrderIndex { get; set; }
    public byte Status { get; set; }
    public string StatusName => AdminDisplayNames.GetStatusName(Status);
    public int TotalProvinces { get; set; }
    public int ActiveProvinces { get; set; }
}

public class CreateAdminRegionRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? Tagline { get; set; }
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public int OrderIndex { get; set; } = 0;
    public byte Status { get; set; } = 1;
}

public class UpdateAdminRegionRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? Tagline { get; set; }
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public int OrderIndex { get; set; }
    public byte Status { get; set; } = 1;
}

public class UpdateAdminStatusRequest
{
    public byte Status { get; set; }
    public string? Reason { get; set; }
}

public class AdminProvinceListItemDto
{
    public int Id { get; set; }
    public int RegionId { get; set; }
    public string RegionName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? Tagline { get; set; }
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public bool Featured { get; set; }
    public int DisplayOrder { get; set; }
    public byte Status { get; set; }
    public string StatusName => AdminDisplayNames.GetStatusName(Status);
    public int PlaceCount { get; set; }
    public int FoodCount { get; set; }
}

public class AdminProvinceDetailDto
{
    public int Id { get; set; }
    public int RegionId { get; set; }
    public string RegionName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? Tagline { get; set; }
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public bool Featured { get; set; }
    public int DisplayOrder { get; set; }
    public byte Status { get; set; }
    public string StatusName => AdminDisplayNames.GetStatusName(Status);
    public int PlaceCount { get; set; }
    public int FoodCount { get; set; }
    public int ProposalCount { get; set; }
    public int AssignedAdminsCount { get; set; }
}

public class CreateAdminProvinceRequest
{
    public int RegionId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? Tagline { get; set; }
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public bool Featured { get; set; } = false;
    public int DisplayOrder { get; set; } = 0;
    public byte Status { get; set; } = 1;
}

public class UpdateAdminProvinceRequest
{
    public int RegionId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? Tagline { get; set; }
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public bool Featured { get; set; }
    public int DisplayOrder { get; set; }
    public byte Status { get; set; } = 1;
}
