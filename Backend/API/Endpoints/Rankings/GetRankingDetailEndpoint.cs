using API.DTOs;
using API.Extensions;
using Application.DTOs;
using Application.Features.Rankings.Queries;
using FastEndpoints;
using MediatR;

namespace API.Endpoints.Rankings;

public class GetRankingDetailRequest
{
    [QueryParam]
    public string Type { get; set; } = "place_type";

    [QueryParam]
    public int? PlaceTypeId { get; set; }

    [QueryParam]
    public int? ProvinceId { get; set; }

    [QueryParam]
    public int? CategoryId { get; set; }

    [QueryParam]
    public int Page { get; set; } = 1;

    [QueryParam]
    public int PageSize { get; set; } = 10;
}

public class GetRankingDetailEndpoint : Endpoint<GetRankingDetailRequest, ApiSuccessResponse<RankingDetailViewDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/rankings/detail");
        AllowAnonymous();
        Options(x => x.RequireRateLimiting("general_api"));
        Summary(s =>
        {
            s.Summary = "Trang chi tiết xếp hạng đi sâu (Deep Dive)";
            s.Description = "Hỗ trợ 3 nhóm bảng xếp hạng phân trang theo rank từ trên xuống: Địa điểm toàn quốc (type=place), Tỉnh thành toàn quốc (type=province), và Địa điểm theo danh mục (type=place_type kèm placeTypeId).";
        });
    }

    public override async Task HandleAsync(GetRankingDetailRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetRankingDetailQuery(
            req.Type,
            req.PlaceTypeId,
            req.ProvinceId,
            req.CategoryId,
            req.Page,
            req.PageSize), ct);

        await this.SendApiResponseAsync(result, ct);
    }
}
