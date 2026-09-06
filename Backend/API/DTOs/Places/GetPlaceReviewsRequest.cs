using FastEndpoints;
using FluentValidation;

namespace API.DTOs.Places;

public class GetPlaceReviewsRequest
{
    [BindFrom("id")]
    public long Id { get; set; }

    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public int? Rating { get; set; }
}

public class GetPlaceReviewsRequestValidator : Validator<GetPlaceReviewsRequest>
{
    public GetPlaceReviewsRequestValidator()
    {
        RuleFor(x => x.Id)
            .GreaterThan(0)
            .WithMessage("Mã địa điểm không hợp lệ.");

        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1)
            .WithMessage("Số trang (page) phải lớn hơn hoặc bằng 1.");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 50)
            .WithMessage("Kích thước trang (pageSize) phải từ 1 đến 50.");

        RuleFor(x => x.Rating)
            .InclusiveBetween(1, 5)
            .When(x => x.Rating.HasValue)
            .WithMessage("Lọc đánh giá sao phải từ 1 đến 5.");
    }
}
