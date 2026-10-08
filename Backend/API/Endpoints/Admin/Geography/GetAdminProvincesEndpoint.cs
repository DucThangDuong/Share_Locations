using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs.Admin;
using Application.Features.Admin.Geography;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Geography;

public class GetAdminProvincesApiRequest
{
    public int? RegionId { get; set; }
    public byte? Status { get; set; }
    public bool? Featured { get; set; }
    public string? Keyword { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 50;
}

public class GetAdminProvincesEndpoint : Endpoint<GetAdminProvincesApiRequest, ApiSuccessResponse<IReadOnlyList<AdminProvinceListItemDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/admin/geography/provinces");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Lấy danh sách Tỉnh/Thành phố (Admin)";
            s.Description = "Danh sách tỉnh/thành có phân trang, lọc theo vùng, từ khóa, trạng thái, và cờ nổi bật.";
        });
    }

    public override async Task HandleAsync(GetAdminProvincesApiRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetAdminProvincesQuery(
            req.RegionId,
            req.Status,
            req.Featured,
            req.Keyword,
            req.Page,
            req.PageSize), ct);

        await this.SendPagedApiResponseAsync(result, ct);
    }
}
