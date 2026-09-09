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

public class SavePlaceRequest
{
    [BindFrom("id")]
    public long Id { get; set; }
}

public class SavePlaceEndpoint : Endpoint<SavePlaceRequest, ApiSuccessResponse<ToggleSavePlaceDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Post("/api/v1/places/{id}/save", "/api/places/{id}/save");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Options(x => x.RequireRateLimiting("write_api"));
        Summary(s =>
        {
            s.Summary = "Lưu địa điểm vào danh sách yêu thích";
            s.Description = "Lưu địa điểm vào danh sách yêu thích cá nhân của người dùng đã đăng nhập.";
        });
    }

    public override async Task HandleAsync(SavePlaceRequest req, CancellationToken ct)
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
            ?? User.FindFirst("sub")?.Value;

        if (!long.TryParse(userIdStr, out var userId))
        {
            await this.SendApiResponseAsync(
                Result<ToggleSavePlaceDto>.Unauthorized("Bạn cần đăng nhập để lưu địa điểm."),
                ct);
            return;
        }

        var result = await Mediator.Send(
            new ToggleSavePlaceCommand(req.Id, userId, Save: true),
            ct);

        await this.SendApiResponseAsync(result, ct);
    }
}
