using API.DTOs;
using API.Extensions;
using Application.Features.Admin.Trips;
using Domain.Constants;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Trips;

public class DeleteAdminTripRequest
{
    [BindFrom("id")]
    public long Id { get; set; }
}

public class DeleteAdminTripEndpoint : Endpoint<DeleteAdminTripRequest, ApiSuccessResponse<bool>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Delete("/api/admin/trips/{id}");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles(AppRoles.AnyAdmin);
        Options(x => x.RequireRateLimiting("write_api"));
        Summary(s =>
        {
            s.Summary = "Xóa lịch trình chuyến đi (Admin)";
            s.Description = "Xóa lịch trình chuyến đi khỏi hệ thống.";
        });
    }

    public override async Task HandleAsync(DeleteAdminTripRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new DeleteAdminTripCommand(req.Id), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
