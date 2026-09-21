using API.DTOs;
using API.Extensions;
using Application.DTOs.Admin;
using Application.Features.Admin.Dashboard;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Catalog;

public class GetAdminCategoriesEndpoint : EndpointWithoutRequest<ApiSuccessResponse<IReadOnlyList<AdminCategoryDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/admin/categories");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Lấy danh mục phân loại hệ thống (Admin)";
            s.Description = "Danh sách danh mục địa điểm và ẩm thực.";
        });
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetAdminCategoriesQuery(), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
