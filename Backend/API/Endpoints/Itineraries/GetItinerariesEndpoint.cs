using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using API.DTOs;
using API.DTOs.Itineraries;
using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Itineraries.Queries;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Itineraries;

public class GetItinerariesEndpoint : Endpoint<GetItinerariesRequest, ApiSuccessResponse<IReadOnlyList<ItineraryDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/v1/itineraries", "/api/itineraries");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Options(x => x.RequireRateLimiting("general_api"));
    }

    public override async Task HandleAsync(GetItinerariesRequest req, CancellationToken ct)
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
            ?? User.FindFirst("sub")?.Value;

        if (string.IsNullOrEmpty(userIdStr))
        {
            await this.SendApiResponseAsync(
                Result<IReadOnlyList<ItineraryDto>>.Unauthorized("Bạn cần đăng nhập để xem lịch trình chi tiết."),
                ct);
            return;
        }

        var result = await Mediator.Send(
            new GetItinerariesQuery(
                req.Duration,
                req.Region,
                req.Keyword,
                req.Page,
                req.PageSize),
            ct);

        await this.SendApiResponseAsync(result, ct);
    }
}
