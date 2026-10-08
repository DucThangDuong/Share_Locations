using API.DTOs;
using API.Extensions;
using Application.DTOs.Admin;
using Application.Features.Admin.Catalog;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Catalog;

public class GetAdminCategoryDetailApiRequest
{
    public int Id { get; set; }
}

public class GetAdminCategoryDetailEndpoint : Endpoint<GetAdminCategoryDetailApiRequest, ApiSuccessResponse<AdminCategoryTaxonomyListItemDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/admin/catalog/categories/{id}");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Xem chi tiết Danh mục (Admin)";
            s.Description = "Chi tiết danh mục kèm số địa điểm, bài viết liên quan và số admin được gán scope.";
        });
    }

    public override async Task HandleAsync(GetAdminCategoryDetailApiRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetAdminCategoryTaxonomyByIdQuery(req.Id), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
