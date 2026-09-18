using API.DTOs;
using API.Extensions;
using Application.DTOs;
using Application.Features.Geography.Queries;
using FastEndpoints;
using MediatR;

namespace API.Endpoints.Geography;

public class GetProvinceLandingRequest
{
    [BindFrom("idOrSlug")]
    public string IdOrSlug { get; set; } = string.Empty;
}

public class GetProvinceLandingEndpoint : Endpoint<GetProvinceLandingRequest, ApiSuccessResponse<ProvinceLandingDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/provinces/{idOrSlug}/landing");
        Tags("Geography");
        AllowAnonymous();
        Options(x => x.RequireRateLimiting("general_api"));
        Summary(s =>
        {
            s.Summary = "Lấy dữ liệu chi tiết trang đích tỉnh thành (Landing Page)";
            s.Description = "Cung cấp toàn bộ dữ liệu chi tiết về tỉnh thành bao gồm banner hero, bộ sưu tập theo chủ đề, địa danh nổi bật, đặc sản ẩm thực, cẩm nang bài viết, lịch trình đề xuất và đánh giá thực tế từ du khách.";
        });
    }

    public override async Task HandleAsync(GetProvinceLandingRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetProvinceLandingQuery(req.IdOrSlug), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}