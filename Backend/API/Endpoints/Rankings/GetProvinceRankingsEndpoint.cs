using API.DTOs;
using API.Extensions;
using Application.DTOs;
using Application.Features.Rankings.Queries;
using FastEndpoints;
using MediatR;

namespace API.Endpoints.Rankings;

public class GetProvinceRankingsRequest
{
    [QueryParam]
    public int? RegionId { get; set; }

    [QueryParam]
    public int Limit { get; set; } = 10;
}

public class GetProvinceRankingsEndpoint : Endpoint<GetProvinceRankingsRequest, ApiSuccessResponse<IReadOnlyList<ProvinceRankingItemDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/rankings/provinces");
        AllowAnonymous();
        Options(x => x.RequireRateLimiting("general_api"));
        Summary(s =>
        {
            s.Summary = "Bảng xếp hạng Tỉnh/Thành phố du lịch hot nhất";
            s.Description = "Xếp hạng các tỉnh/thành phố dựa trên độ phổ biến, số lượng địa điểm chất lượng cao, đánh giá và lượt tương tác tổng hợp.";
        });
    }

    public override async Task HandleAsync(GetProvinceRankingsRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetProvinceRankingsQuery(
            req.RegionId,
            req.Limit), ct);

        await this.SendApiResponseAsync(result, ct);
    }
}
