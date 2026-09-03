using API.DTOs;
using API.DTOs.Auth;
using API.Extensions;
using Application.DTOs;
using Application.Features.Auth.Commands;
using FastEndpoints;
using MediatR;

namespace API.Endpoints.Auth;

public class GoogleLoginEndpoint : Endpoint<GoogleLoginRequest, ApiSuccessResponse<AuthTokenResponse>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Post("/api/auth/google");
        AllowAnonymous();
        Options(x => x.RequireRateLimiting("auth_strict"));
    }

    public override async Task HandleAsync(GoogleLoginRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new GoogleLoginCommand(req.IdToken), ct);

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
