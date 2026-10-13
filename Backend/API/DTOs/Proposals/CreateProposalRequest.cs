using FastEndpoints;
using Microsoft.AspNetCore.Http;

namespace API.DTOs.Proposals;

public class CreateProposalRequest
{
    public string Name { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public int ProvinceId { get; set; }
    public string Address { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Website { get; set; }
    public string? OpeningHours { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public string? Description { get; set; }

    public string? CoverImg { get; set; }
    public List<string>? MediaUrls { get; set; }
    public List<string>? Images { get; set; }

    public IFormFile? CoverImage { get; set; }
    public IFormFile? CoverImageFile { get; set; }
    public List<IFormFile>? Photos { get; set; }
    public List<IFormFile>? MediaFiles { get; set; }
}
