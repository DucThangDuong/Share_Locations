using API.DTOs;
using API.DTOs.Places;
using API.Extensions;
using Application.DTOs;
using Application.Features.Places.Queries;
using FastEndpoints;
using MediatR;

namespace API.Endpoints.Places;

public class SearchPlacesEndpoint : Endpoint<SearchPlacesRequest, ApiSuccessResponse<IReadOnlyList<PlaceSummaryDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/places");
        AllowAnonymous();
        Options(x => x.RequireRateLimiting("general_api"));
        Summary(s =>
        {
            s.Summary = "Tìm kiếm và lọc danh sách địa điểm";
            s.Description = "Tìm kiếm các địa điểm du lịch với nhiều tiêu chí: từ khóa, vùng miền (hỗ trợ nhiều RegionId), tỉnh thành (nhiều ProvinceId), loại hình (nhiều PlaceTypeId), danh mục (nhiều CategoryId), khoảng giá, điểm đánh giá và sắp xếp phân trang. Lưu ý: Bộ lọc ưu tiên Region hơn Province, nếu có Region thì sẽ lấy tất cả Province thuộc Region đó.";
        });
    }

    public override async Task HandleAsync(SearchPlacesRequest req, CancellationToken ct)
    {
        var regionIds = ExtractIds(req.RegionIds, req.RegionId, "regionIds", "regionId");
        var provinceIds = ExtractIds(req.ProvinceIds, req.ProvinceId, "provinceIds", "provinceId");
        var categoryIds = ExtractIds(req.CategoryIds, req.CategoryId, "categoryIds", "categoryId");
        var placeTypeIds = ExtractIds(req.PlaceTypeIds, req.PlaceTypeId, "placeTypeIds", "placeTypeId");

        var filterParams = new PlaceFilterParams
        {
            Keyword = req.Keyword,
            RegionId = req.RegionId,
            RegionIds = regionIds,
            ProvinceId = req.ProvinceId,
            ProvinceIds = provinceIds,
            CategoryId = req.CategoryId,
            CategoryIds = categoryIds,
            PlaceTypeId = req.PlaceTypeId,
            PlaceTypeIds = placeTypeIds,
            MinPrice = req.MinPrice,
            MaxPrice = req.MaxPrice,
            MinRating = req.MinRating,
            SortBy = req.SortBy,
            Page = req.Page,
            PageSize = req.PageSize
        };

        var result = await Mediator.Send(new SearchPlacesQuery(filterParams), ct);
        await this.SendPagedApiResponseAsync(result, ct);
    }

    private List<int> ExtractIds(List<int>? boundList, int? boundSingle, string keyPlural, string keySingular)
    {
        var result = new HashSet<int>();

        if (boundSingle.HasValue && boundSingle.Value > 0)
        {
            result.Add(boundSingle.Value);
        }

        if (boundList != null)
        {
            foreach (var id in boundList)
            {
                if (id > 0) result.Add(id);
            }
        }

        // Hỗ trợ trích xuất từ Query string kể cả khi truyền dạng chuỗi comma-separated: ?regionIds=1,2,3 hoặc ?regionId=1,2
        var query = HttpContext.Request.Query;
        foreach (var key in new[] { keyPlural, keySingular })
        {
            if (query.TryGetValue(key, out var values))
            {
                foreach (var val in values)
                {
                    if (string.IsNullOrWhiteSpace(val)) continue;
                    var parts = val.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
                    foreach (var part in parts)
                    {
                        if (int.TryParse(part, out var parsedId) && parsedId > 0)
                        {
                            result.Add(parsedId);
                        }
                    }
                }
            }
        }

        return result.ToList();
    }
}
