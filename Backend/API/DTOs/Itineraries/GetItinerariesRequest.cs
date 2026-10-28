using FastEndpoints;
using FluentValidation;

namespace API.DTOs.Itineraries;

public class GetItinerariesRequest
{
    public string? Destination { get; set; }
    public string? Duration { get; set; }
    public string? Budget { get; set; }
    public string? Keyword { get; set; }

    [BindFrom("q")]
    public string? Q { get; set; }

    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 12;

    public string? GetEffectiveKeyword() => !string.IsNullOrWhiteSpace(Keyword) ? Keyword : Q;
}

public class GetItinerariesRequestValidator : Validator<GetItinerariesRequest>
{
    public GetItinerariesRequestValidator()
    {
        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1)
            .WithMessage("Số trang (page) phải lớn hơn hoặc bằng 1.");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 100)
            .WithMessage("Kích thước trang (pageSize) phải từ 1 đến 100.");
    }
}
