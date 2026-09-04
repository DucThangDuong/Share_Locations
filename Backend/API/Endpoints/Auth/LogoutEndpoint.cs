using API.Extensions;
using Application.Features.Auth.Commands;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using System.Security.Claims;

namespace API.Endpoints.Auth;
public class LogoutEndpoint : EndpointWithoutRequest
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Post("/api/v1/auth/logout", "/api/auth/logout");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Options(x => x.RequireRateLimiting("auth_strict"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {

        var accessToken = HttpContext.Request.Headers[Microsoft.Net.Http.Headers.HeaderNames.Authorization]
            .FirstOrDefault()?.Replace("Bearer ", "", StringComparison.OrdinalIgnoreCase);
        var refreshToken = HttpContext.Request.Cookies["refreshToken"];

        var result = await Mediator.Send(new LogoutCommand(accessToken, refreshToken), ct);

        if (result.IsSuccess)
        {
            HttpContext.Response.Cookies.Delete("refreshToken", new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None,
                IsEssential = true
            });
        }

        await this.SendApiResponseAsync(result, ct);
    }
}
