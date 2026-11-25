using API.DTOs;
using API.Extensions;
using Application.DTOs.Admin;
using Application.Features.Admin.Trips;
using Domain.Constants;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Trips;

public class GetAdminTripsRequest
{
    public int? ProvinceId { get; set; }
    public byte? Privacy { get; set; }
    public byte? Status { get; set; }
    public string? Keyword { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 15;
    public string? SortBy { get; set; }
    public string? SortOrder { get; set; }
}

public class GetAdminTripsEndpoint : Endpoint<GetAdminTripsRequest, ApiSuccessResponse<IReadOnlyList<AdminTripListItemDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/admin/trips");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles(AppRoles.AnyAdmin);
        Options(x => x.RequireRateLimiting("general_api"));
        Summary(s =>
        {
            s.Summary = "Lấy danh sách lịch trình chuyến đi (Admin)";
            s.Description = "Danh sách lịch trình chuyến đi phục vụ kiểm duyệt và quản trị.";
        });
    }

    public override async Task HandleAsync(GetAdminTripsRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(
            new GetAdminTripsQuery(
                req.ProvinceId,
                req.Privacy,
                req.Status,
                req.Keyword,
                req.Page,
                req.PageSize,
                req.SortBy,
                req.SortOrder),
            ct);

        await this.SendPagedApiResponseAsync(result, ct);
    }
}
