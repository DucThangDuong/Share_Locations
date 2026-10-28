using API.DTOs;
using API.Extensions;
using Application.DTOs;
using Application.Features.Rankings.Queries;
using FastEndpoints;
using MediatR;

namespace API.Endpoints.Rankings;

public class GetPlaceRankingsRequest
{
    [QueryParam]
    public int? PlaceTypeId { get; set; }

    [QueryParam]
    public int? CategoryId { get; set; }

    [QueryParam]
    public int? ProvinceId { get; set; }

    [QueryParam]
    public int? RegionId { get; set; }

    [QueryParam]
    public string Period { get; set; } = "all_time";

    [QueryParam]
    public int Limit { get; set; } = 10;

    [QueryParam]
    public bool IncludeExcluded { get; set; } = false;
}

public class GetPlaceRankingsEndpoint : Endpoint<GetPlaceRankingsRequest, ApiSuccessResponse<IReadOnlyList<PlaceRankingItemDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/rankings/places");
        AllowAnonymous();
        Options(x => x.RequireRateLimiting("general_api"));
        Summary(s =>
        {
            s.Summary = "Bảng xếp hạng địa điểm (hỗ trợ lọc theo loại hình PlaceType, Tỉnh thành, Vùng miền)";
            s.Description = "Xếp hạng các địa điểm theo công thức Hybrid (Bayesian Weighted Rating + cấu hình trọng số Admin, ghim và loại trừ).";
        });
    }

    public override async Task HandleAsync(GetPlaceRankingsRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetPlaceRankingsQuery(
            req.PlaceTypeId,
            req.CategoryId,
            req.ProvinceId,
            req.RegionId,
            req.Period,
            req.Limit,
            req.IncludeExcluded), ct);

        await this.SendApiResponseAsync(result, ct);
    }
}
