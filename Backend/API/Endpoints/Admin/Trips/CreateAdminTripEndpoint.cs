using API.DTOs;
using API.Extensions;
using Application.DTOs.Admin;
using Application.Features.Admin.Trips;
using Domain.Constants;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Trips;

public class CreateAdminTripEndpoint : Endpoint<CreateAdminTripInput, ApiSuccessResponse<long>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Post("/api/admin/trips");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles(AppRoles.AnyAdmin);
        Options(x => x.RequireRateLimiting("write_api"));
        Summary(s =>
        {
            s.Summary = "Tạo mới lịch trình chuyến đi (Admin)";
            s.Description = "Tạo mới lịch trình chuyến đi mẫu hoặc gợi ý trên hệ thống.";
        });
    }

    public override async Task HandleAsync(CreateAdminTripInput req, CancellationToken ct)
    {
        var result = await Mediator.Send(new CreateAdminTripCommand(req), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
