using API.Extensions;
using Application.Features.Auth.Commands;
using FastEndpoints;
using MediatR;

namespace API.Endpoints.Auth;

public class RefreshTokenEndpoint : EndpointWithoutRequest
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Post("/api/auth/refresh-token");
        AllowAnonymous();
        Options(x => x.RequireRateLimiting("auth_strict"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var accessToken = HttpContext.Request.Headers[Microsoft.Net.Http.Headers.HeaderNames.Authorization]
            .FirstOrDefault()?.Replace("Bearer ", "", StringComparison.OrdinalIgnoreCase);
        var refreshToken = HttpContext.Request.Cookies["refreshToken"];

        var result = await Mediator.Send(new RefreshTokenCommand(accessToken, refreshToken), ct);

        if (result.IsSuccess && result.Data is not null)
        {
            HttpContext.Response.Cookies.Append("refreshToken", result.Data.RefreshToken, new CookieOptions
            {
                HttpOnly = true,
                Expires = result.Data.RefreshTokenExpiryTime,
                Secure = true,
                SameSite = SameSiteMode.None,
                IsEssential = true
            });
            result.Data.RefreshTokenExpiryTime = DateTime.UtcNow;
            result.Data.RefreshToken = string.Empty;
        }

        await this.SendApiResponseAsync(result, ct);
    }
}
