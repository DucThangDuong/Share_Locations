using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs.Admin;
using Application.Features.Admin.Places;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Places;

public class GetAdminPlacesRequest
{
    public int? ProvinceId { get; set; }
    public int? CategoryId { get; set; }
    public int? Status { get; set; }
    public string? Keyword { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public class GetAdminPlacesEndpoint : Endpoint<GetAdminPlacesRequest, ApiSuccessResponse<IReadOnlyList<AdminPlaceListItemDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/admin/places");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Lấy danh sách địa điểm quản trị (Admin)";
            s.Description = "Danh sách địa điểm phục vụ màn hình quản trị với đầy đủ trạng thái và tìm kiếm.";
        });
    }

    public override async Task HandleAsync(GetAdminPlacesRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(
            new GetAdminPlacesQuery(
                req.ProvinceId,
                req.CategoryId,
                req.Status,
                req.Keyword,
                req.Page,
                req.PageSize),
            ct);

        await this.SendPagedApiResponseAsync(result, ct);
    }
}
