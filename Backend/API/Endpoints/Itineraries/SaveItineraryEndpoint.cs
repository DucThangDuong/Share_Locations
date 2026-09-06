using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Itineraries.Commands;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Itineraries;

public class SaveItineraryRequest
{
    [BindFrom("id")]
    public long Id { get; set; }
}

public class SaveItineraryEndpoint : Endpoint<SaveItineraryRequest, ApiSuccessResponse<SaveItineraryResponseDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Post("/api/v1/itineraries/{id}/save", "/api/itineraries/{id}/save");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Options(x => x.RequireRateLimiting("write_api"));
    }

    public override async Task HandleAsync(SaveItineraryRequest req, CancellationToken ct)
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
            ?? User.FindFirst("sub")?.Value;

        if (!long.TryParse(userIdStr, out var userId))
        {
            await this.SendApiResponseAsync(
                Result<SaveItineraryResponseDto>.Unauthorized("Bạn cần đăng nhập để lưu lịch trình."),
                ct);
            return;
        }

        var result = await Mediator.Send(new SaveItineraryCommand(req.Id, userId), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
