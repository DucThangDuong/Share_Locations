using FastEndpoints;
using FluentValidation;

namespace API.DTOs.Places;

public class SearchPlacesRequest
{
    public string? Keyword { get; set; }
    public int? RegionId { get; set; }
    public int? ProvinceId { get; set; }
    public int? CategoryId { get; set; }
    public int? PlaceTypeId { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public decimal? MinRating { get; set; }
    public string? SortBy { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 12;
}

public class SearchPlacesRequestValidator : Validator<SearchPlacesRequest>
{
    public SearchPlacesRequestValidator()
    {
        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1)
            .WithMessage("Số trang (page) phải lớn hơn hoặc bằng 1.");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 50)
            .WithMessage("Kích thước trang (pageSize) phải từ 1 đến 50.");

        RuleFor(x => x.MinPrice)
            .GreaterThanOrEqualTo(0)
            .When(x => x.MinPrice.HasValue)
            .WithMessage("Giá tối thiểu không được âm.");

        RuleFor(x => x.MaxPrice)
            .GreaterThanOrEqualTo(0)
            .When(x => x.MaxPrice.HasValue)
            .WithMessage("Giá tối đa không được âm.");

        RuleFor(x => x.MinRating)
            .InclusiveBetween(1.0m, 5.0m)
            .When(x => x.MinRating.HasValue)
            .WithMessage("Đánh giá sao tối thiểu phải từ 1.0 đến 5.0.");
    }
}
