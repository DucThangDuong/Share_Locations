using Domain.Constants;

namespace Application.DTOs.Admin;

public class AdminPlaceTypeListItemDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? ImageUrl { get; set; }
    public byte Status { get; set; }
    public string StatusName => AdminDisplayNames.GetStatusName(Status);
    public int TotalCategories { get; set; }
    public int ActiveCategories { get; set; }
}

public class CreateAdminPlaceTypeRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? ImageUrl { get; set; }
    public byte Status { get; set; } = 1;
}

public class UpdateAdminPlaceTypeRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? ImageUrl { get; set; }
    public byte Status { get; set; } = 1;
}

public class AdminCategoryTaxonomyListItemDto
{
    public int Id { get; set; }
    public int PlaceTypeId { get; set; }
    public string PlaceTypeName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? ImageUrl { get; set; }
    public byte Status { get; set; }
    public string StatusName => AdminDisplayNames.GetStatusName(Status);
    public int PlaceCount { get; set; }
    public int BlogCount { get; set; }
    public int ProposalCount { get; set; }
    public int AssignedAdminsCount { get; set; }
}

public class CreateAdminCategoryRequest
{
    public int PlaceTypeId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? ImageUrl { get; set; }
    public byte Status { get; set; } = 1;
}

public class UpdateAdminCategoryRequest
{
    public int PlaceTypeId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? ImageUrl { get; set; }
    public byte Status { get; set; } = 1;
}
