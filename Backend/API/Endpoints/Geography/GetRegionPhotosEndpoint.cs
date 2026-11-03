using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Geography.Queries;
using FastEndpoints;
using MediatR;

namespace API.Endpoints.Geography;

public class GetRegionPhotosRequest
{
    [BindFrom("regionSlug")]
    public string RegionSlug { get; set; } = string.Empty;

    [QueryParam]
    public int Page { get; set; } = 1;

    [QueryParam]
    public int PageSize { get; set; } = 20;
}

public class GetRegionPhotosEndpoint : Endpoint<GetRegionPhotosRequest, ApiSuccessResponse<PagedResult<RegionHeroImageDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/regions/{regionSlug}/photos");
        AllowAnonymous();
        Options(x => x.RequireRateLimiting("general_api"));
        Summary(s =>
        {
            s.Summary = "Lấy danh sách hình ảnh phong cảnh của vùng miền (phân trang)";
            s.Description = "Cung cấp danh sách hình ảnh phong cảnh, danh lam thắng cảnh của toàn vùng miền có hỗ trợ phân trang (page, pageSize).";
        });
    }

    public override async Task HandleAsync(GetRegionPhotosRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetRegionPhotosQuery(req.RegionSlug, req.Page, req.PageSize), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}

