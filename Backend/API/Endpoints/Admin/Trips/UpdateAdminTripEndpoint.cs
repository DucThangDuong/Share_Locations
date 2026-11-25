using API.DTOs;
using API.Extensions;
using Application.DTOs.Admin;
using Application.Features.Admin.Trips;
using Domain.Constants;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Trips;

public class UpdateAdminTripRequest : UpdateAdminTripInput
{
    [BindFrom("id")]
    public long Id { get; set; }
}

public class UpdateAdminTripEndpoint : Endpoint<UpdateAdminTripRequest, ApiSuccessResponse<bool>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Put("/api/admin/trips/{id}");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles(AppRoles.AnyAdmin);
        Options(x => x.RequireRateLimiting("write_api"));
        Summary(s =>
        {
            s.Summary = "Cập nhật lịch trình chuyến đi (Admin)";
            s.Description = "Cập nhật thông tin lịch trình chuyến đi, danh sách ngày và các điểm dừng.";
        });
    }

    public override async Task HandleAsync(UpdateAdminTripRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new UpdateAdminTripCommand(req.Id, req), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
