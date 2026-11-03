using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Geography.Queries;
using FastEndpoints;
using MediatR;

namespace API.Endpoints.Geography;

public class GetProvincePhotosRequest
{
    [BindFrom("idOrSlug")]
    public string IdOrSlug { get; set; } = string.Empty;

    [QueryParam]
    public int Page { get; set; } = 1;

    [QueryParam]
    public int PageSize { get; set; } = 20;
}

public class GetProvincePhotosEndpoint : Endpoint<GetProvincePhotosRequest, ApiSuccessResponse<PagedResult<RegionHeroImageDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/provinces/{idOrSlug}/photos");
        AllowAnonymous();
        Options(x => x.RequireRateLimiting("general_api"));
        Summary(s =>
        {
            s.Summary = "Lấy danh sách hình ảnh địa danh của tỉnh thành (phân trang)";
            s.Description = "Cung cấp danh sách hình ảnh các địa danh nổi bật thuộc tỉnh thành có hỗ trợ phân trang (page, pageSize).";
        });
    }

    public override async Task HandleAsync(GetProvincePhotosRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetProvincePhotosQuery(req.IdOrSlug, req.Page, req.PageSize), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}

