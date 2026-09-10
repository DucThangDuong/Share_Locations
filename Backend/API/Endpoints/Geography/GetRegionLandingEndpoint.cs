using API.DTOs;
using API.Extensions;
using Application.DTOs;
using Application.Features.Geography.Queries;
using FastEndpoints;
using MediatR;

namespace API.Endpoints.Geography;

public class GetRegionLandingRequest
{
    [BindFrom("regionSlug")]
    public string RegionSlug { get; set; } = string.Empty;
}

public class GetRegionLandingEndpoint : Endpoint<GetRegionLandingRequest, ApiSuccessResponse<RegionLandingDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/v1/regions/{regionSlug}/landing", "/api/regions/{regionSlug}/landing");
        AllowAnonymous();
        Options(x => x.RequireRateLimiting("general_api"));
        Summary(s =>
        {
            s.Summary = "Lấy dữ liệu chi tiết trang đích vùng miền (Landing Page)";
            s.Description = "Cung cấp dữ liệu chi tiết về vùng miền (Miền Bắc: mien-bac/north, Miền Trung: mien-trung/central, Miền Nam: mien-nam/south) bao gồm tiêu điểm văn hoá, địa danh nổi bật, ẩm thực đặc trưng, bài viết cẩm nang, bộ sưu tập và đánh giá thực tế từ du khách.";
        });
    }

    public override async Task HandleAsync(GetRegionLandingRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetRegionLandingQuery(req.RegionSlug), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
