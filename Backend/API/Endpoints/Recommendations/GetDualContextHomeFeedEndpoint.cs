using API.DTOs;
using API.Extensions;
using Application.Common.Interfaces;
using Application.DTOs;
using FastEndpoints;

namespace API.Endpoints.Recommendations;

public class GetDualContextHomeFeedRequest
{
    [QueryParam]
    public double? Lat { get; set; }

    [QueryParam]
    public double? Lng { get; set; }

    [QueryParam]
    public int? IntentProvinceId { get; set; }

    [QueryParam]
    public string? IntentProvinceIds { get; set; }

    [QueryParam]
    public string? IntentLabel { get; set; }

    [QueryParam]
    public string? TopCategoryIds { get; set; }

    [QueryParam]
    public string? ExcludePlaceIds { get; set; }

    [QueryParam]
    public int TopK { get; set; } = 12;
}

public class GetDualContextHomeFeedEndpoint : Endpoint<GetDualContextHomeFeedRequest, ApiSuccessResponse<DualContextHomeFeedResponse>>
{
    public IRecommendationService RecommendationService { get; set; } = null!;
    public ICurrentUserService CurrentUserService { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/recommendations/home-feed");
        AllowAnonymous();
        Options(x => x.RequireRateLimiting("general_api"));
        Summary(s =>
        {
            s.Summary = "Trang chủ Ngữ cảnh kép (Dual-Context Home Feed)";
            s.Description = "Lấy dữ liệu 3 kệ trang chủ kết hợp Vị trí GPS vật lý (Kệ 1), Điểm đến ý định tìm kiếm/lướt xem (Kệ 2), và Bộ sưu tập/Lịch trình pha trộn (Kệ 3).";
        });
    }

    public override async Task HandleAsync(GetDualContextHomeFeedRequest req, CancellationToken ct)
    {
        var topCatIds = !string.IsNullOrWhiteSpace(req.TopCategoryIds)
            ? req.TopCategoryIds.Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(s => int.TryParse(s.Trim(), out var id) ? id : 0)
                .Where(id => id > 0)
                .ToList()
            : null;

        var excludeIds = !string.IsNullOrWhiteSpace(req.ExcludePlaceIds)
            ? req.ExcludePlaceIds.Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(s => long.TryParse(s.Trim(), out var id) ? id : 0)
                .Where(id => id > 0)
                .ToList()
            : null;

        var intentProvIds = !string.IsNullOrWhiteSpace(req.IntentProvinceIds)
            ? req.IntentProvinceIds.Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(s => int.TryParse(s.Trim(), out var id) ? id : 0)
                .Where(id => id > 0)
                .Distinct()
                .Take(3)
                .ToList()
            : (req.IntentProvinceId.HasValue && req.IntentProvinceId.Value > 0
                ? new List<int> { req.IntentProvinceId.Value }
                : null);

        int safeTopK = Math.Clamp(req.TopK, 1, 30);
        string? deviceId = CurrentUserService.DeviceId;

        var feed = await RecommendationService.GetDualContextHomeFeedAsync(
            deviceId,
            req.Lat,
            req.Lng,
            req.IntentProvinceId,
            req.IntentLabel,
            topCatIds,
            excludeIds,
            safeTopK,
            intentProvIds,
            ct);

        await this.SendApiResponseAsync(
            Application.Common.Result<DualContextHomeFeedResponse>.Success(feed, "Lấy dữ liệu trang chủ theo ngữ cảnh thành công"),
            ct);
    }
}

