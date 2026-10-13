using API.DTOs;
using API.Extensions;
using Application.DTOs;
using Application.Features.Rankings.Queries;
using FastEndpoints;
using MediatR;

namespace API.Endpoints.Rankings;

public class GetRankingOverviewEndpoint : EndpointWithoutRequest<ApiSuccessResponse<RankingOverviewDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/rankings/overview");
        AllowAnonymous();
        Options(x => x.RequireRateLimiting("general_api"));
        Summary(s =>
        {
            s.Summary = "Trang tổng quan Bảng xếp hạng";
            s.Description = "Cung cấp loại giải thưởng";
        });
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetRankingOverviewQuery(), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
