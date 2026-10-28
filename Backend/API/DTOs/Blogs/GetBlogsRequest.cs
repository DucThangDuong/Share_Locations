using FastEndpoints;
using FluentValidation;

namespace API.DTOs.Blogs;

public class GetBlogsRequest
{
    public string? Category { get; set; }
    public int? CategoryId { get; set; }
    public List<int>? CategoryIds { get; set; }
    public int? PlaceTypeId { get; set; }
    public List<int>? PlaceTypeIds { get; set; }
    public string? Keyword { get; set; }
    public int Page { get; set; } = 1;
    public int? PageSize { get; set; }

    [BindFrom("size")]
    public int? Size { get; set; }

    public int GetEffectivePageSize() => Size.HasValue && Size.Value > 0 ? Size.Value : (PageSize.HasValue && PageSize.Value > 0 ? PageSize.Value : 9);
}

public class GetBlogsRequestValidator : Validator<GetBlogsRequest>
{
    public GetBlogsRequestValidator()
    {
        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1)
            .WithMessage("Số trang (page) phải lớn hơn hoặc bằng 1.");

        RuleFor(x => x.GetEffectivePageSize())
            .InclusiveBetween(1, 100)
            .WithMessage("Số lượng bài mỗi trang (size/pageSize) phải từ 1 đến 100.");
    }
}
