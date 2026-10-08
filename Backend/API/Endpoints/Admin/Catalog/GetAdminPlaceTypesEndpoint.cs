using API.DTOs;
using API.Extensions;
using Application.DTOs.Admin;
using Application.Features.Admin.Catalog;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Catalog;

public class GetAdminPlaceTypesEndpoint : EndpointWithoutRequest<ApiSuccessResponse<IReadOnlyList<AdminPlaceTypeListItemDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/admin/catalog/place-types");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Lấy danh sách các Loại địa điểm / Trụ cột trải nghiệm (Admin)";
            s.Description = "Danh sách loại địa điểm lớn (Ẩm thực, Lưu trú, Tham quan, Giải trí...) kèm số danh mục trực thuộc.";
        });
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetAdminPlaceTypesQuery(), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
