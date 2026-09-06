using FastEndpoints;
using FluentValidation;

namespace API.DTOs.Foods;

public class GetFoodsRequest
{
    public string? Region { get; set; }
    public string? Category { get; set; }
    public string? Keyword { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public class GetFoodsRequestValidator : Validator<GetFoodsRequest>
{
    public GetFoodsRequestValidator()
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
    }
}
