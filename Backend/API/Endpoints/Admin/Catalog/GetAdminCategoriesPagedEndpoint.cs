using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs.Admin;
using Application.Features.Admin.Catalog;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Catalog;

public class GetAdminCategoriesPagedApiRequest
{
    public int? PlaceTypeId { get; set; }
    public byte? Status { get; set; }
    public string? Keyword { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 50;
}

public class GetAdminCategoriesPagedEndpoint : Endpoint<GetAdminCategoriesPagedApiRequest, ApiSuccessResponse<IReadOnlyList<AdminCategoryTaxonomyListItemDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/admin/catalog/categories");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Lấy danh sách Danh mục chi tiết (Admin)";
            s.Description = "Danh sách danh mục địa điểm có phân trang, lọc theo loại địa điểm (PlaceTypeId), trạng thái và từ khóa.";
        });
    }

    public override async Task HandleAsync(GetAdminCategoriesPagedApiRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetAdminCategoriesPagedQuery(
            req.PlaceTypeId,
            req.Status,
            req.Keyword,
            req.Page,
            req.PageSize), ct);

        await this.SendPagedApiResponseAsync(result, ct);
    }
}
