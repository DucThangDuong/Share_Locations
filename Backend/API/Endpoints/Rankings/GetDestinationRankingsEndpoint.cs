using API.DTOs;
using API.Extensions;
using Application.DTOs;
using Application.Features.Rankings.Queries;
using FastEndpoints;
using MediatR;

namespace API.Endpoints.Rankings;

public class GetDestinationRankingsRequest
{
    [QueryParam]
    public int? RegionId { get; set; }

    [QueryParam]
    public int? CategoryId { get; set; }

    [QueryParam]
    public int Limit { get; set; } = 10;
}

public class GetDestinationRankingsEndpoint : Endpoint<GetDestinationRankingsRequest, ApiSuccessResponse<IReadOnlyList<DestinationRankingItemDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/rankings/destinations", "/api/rankings/provinces/featured");
        AllowAnonymous();
        Options(x => x.RequireRateLimiting("general_api"));
        Summary(s =>
        {
            s.Summary = "Bảng xếp hạng Điểm đến du lịch đỉnh cao (Best Destinations Awards)";
            s.Description = "Cung cấp danh sách điểm đến du lịch xuất sắc nhất kèm danh sách địa điểm đoạt giải con (Award-winning Places), tags hoạt động và cẩm nang du lịch (Travel Stories) theo chuẩn thiết kế TripAdvisor.";
        });
    }

    public override async Task HandleAsync(GetDestinationRankingsRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetDestinationRankingsQuery(
            req.RegionId,
            req.CategoryId,
            req.Limit), ct);

        await this.SendApiResponseAsync(result, ct);
    }
}
