using API.DTOs;
using API.Extensions;
using Application.DTOs;
using Application.Features.Catalog.Queries;
using FastEndpoints;
using MediatR;

namespace API.Endpoints.Catalog;

public class GetFeaturedCollectionsRequest
{
    public double? Lat { get; set; }
    public double? Lng { get; set; }
    public string? IntentProvinceIds { get; set; }
    public string? TopCategoryIds { get; set; }
    public int? Count { get; set; }
}

public class GetFeaturedCollectionsEndpoint : Endpoint<GetFeaturedCollectionsRequest, ApiSuccessResponse<IReadOnlyList<CollectionDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/collections/featured");
        AllowAnonymous();
        Options(x => x.RequireRateLimiting("general_api"));
        Summary(s =>
        {
            s.Summary = "Lấy danh sách bộ sưu tập nổi bật cá nhân hóa";
            s.Description = "Lấy danh sách các bộ sưu tập được chấm điểm theo khoảng cách GPS thực tế, điểm đến chuyến đi và gu danh mục của người dùng.";
        });
    }

    public override async Task HandleAsync(GetFeaturedCollectionsRequest req, CancellationToken ct)
    {
        double? validLat = (req?.Lat >= -90 && req?.Lat <= 90) ? req?.Lat : null;
        double? validLng = (req?.Lng >= -180 && req?.Lng <= 180) ? req?.Lng : null;
        int count = Math.Clamp(req?.Count.GetValueOrDefault(6) ?? 6, 1, 12);

        var intentList = ParseIds(req?.IntentProvinceIds);
        var topCatList = ParseIds(req?.TopCategoryIds);

        var result = await Mediator.Send(new GetFeaturedCollectionsQuery(
            Lat: validLat,
            Lng: validLng,
            IntentProvinceIds: intentList,
            TopCategoryIds: topCatList,
            Count: count
        ), ct);

        await this.SendApiResponseAsync(result, ct);
    }

    private static List<int> ParseIds(string? input)
    {
        if (string.IsNullOrWhiteSpace(input)) return [];
        return input.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(s => int.TryParse(s, out var v) ? v : 0)
            .Where(v => v > 0)
            .Distinct()
            .Take(3)
            .ToList();
    }
}
