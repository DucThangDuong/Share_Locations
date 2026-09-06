using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Places.Commands;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Places;

public class UnsavePlaceRequest
{
    [BindFrom("id")]
    public long Id { get; set; }
}

public class UnsavePlaceEndpoint : Endpoint<UnsavePlaceRequest, ApiSuccessResponse<ToggleSavePlaceDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Delete("/api/v1/places/{id}/save", "/api/places/{id}/save");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Options(x => x.RequireRateLimiting("write_api"));
    }

    public override async Task HandleAsync(UnsavePlaceRequest req, CancellationToken ct)
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
            ?? User.FindFirst("sub")?.Value;

        if (!long.TryParse(userIdStr, out var userId))
        {
            await this.SendApiResponseAsync(
                Result<ToggleSavePlaceDto>.Unauthorized("Bạn cần đăng nhập để thao tác."),
                ct);
            return;
        }

        var result = await Mediator.Send(
            new ToggleSavePlaceCommand(req.Id, userId, Save: false),
            ct);

        await this.SendApiResponseAsync(result, ct);
    }
}
