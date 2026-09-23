using API.DTOs;
using API.DTOs.Blogs;
using API.Extensions;
using Application.DTOs;
using Application.Features.Blogs.Queries;
using FastEndpoints;
using MediatR;

namespace API.Endpoints.Blogs;

public class GetBlogsEndpoint : Endpoint<GetBlogsRequest, ApiSuccessResponse<IReadOnlyList<BlogListItemDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/blogs");
        AllowAnonymous();
        Options(x => x.RequireRateLimiting("general_api"));
        Summary(s =>
        {
            s.Summary = "Lấy danh sách bài viết blog";
            s.Description = "Tìm kiếm và lấy danh sách các bài viết chia sẻ kinh nghiệm du lịch, có hỗ trợ lọc theo loại hình địa điểm (PlaceTypeId/PlaceTypeIds), danh mục (CategoryId/CategoryIds/Category), từ khóa và phân trang.";
        });
    }

    public override async Task HandleAsync(GetBlogsRequest req, CancellationToken ct)
    {
        var categoryIds = ExtractIds(req.CategoryIds, req.CategoryId, "categoryIds", "categoryId");
        var placeTypeIds = ExtractIds(req.PlaceTypeIds, req.PlaceTypeId, "placeTypeIds", "placeTypeId");

        var filterParams = new BlogFilterParams
        {
            Category = req.Category,
            CategoryId = req.CategoryId,
            CategoryIds = categoryIds,
            PlaceTypeId = req.PlaceTypeId,
            PlaceTypeIds = placeTypeIds,
            Keyword = req.Keyword,
            Page = req.Page,
            PageSize = req.PageSize
        };

        var result = await Mediator.Send(new GetBlogsQuery(filterParams), ct);
        await this.SendApiResponseAsync(result, ct);
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
