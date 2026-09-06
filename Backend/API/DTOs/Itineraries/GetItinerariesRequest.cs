using FastEndpoints;
using FluentValidation;

namespace API.DTOs.Itineraries;

public class GetItinerariesRequest
{
    public string? Duration { get; set; }
    public string? Region { get; set; }
    public string? Keyword { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public class GetItinerariesRequestValidator : Validator<GetItinerariesRequest>
{
    public GetItinerariesRequestValidator()
    {
        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1)
            .WithMessage("Số trang (page) phải lớn hơn hoặc bằng 1.");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 50)
            .WithMessage("Kích thước trang (pageSize) phải từ 1 đến 50.");
    }
}
