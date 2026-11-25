using API.DTOs;
using API.Extensions;
using Application.DTOs.Admin;
using Application.Features.Admin.Trips;
using Domain.Constants;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Trips;

public class GetAdminTripDetailRequest
{
    [BindFrom("id")]
    public long Id { get; set; }
}

public class GetAdminTripDetailEndpoint : Endpoint<GetAdminTripDetailRequest, ApiSuccessResponse<AdminTripDetailDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/admin/trips/{id}");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles(AppRoles.AnyAdmin);
        Options(x => x.RequireRateLimiting("general_api"));
        Summary(s =>
        {
            s.Summary = "Lấy chi tiết lịch trình chuyến đi (Admin)";
            s.Description = "Chi tiết lịch trình chuyến đi bao gồm các ngày, điểm dừng và thành viên.";
        });
    }

    public override async Task HandleAsync(GetAdminTripDetailRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetAdminTripDetailQuery(req.Id), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
