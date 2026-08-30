using API.DTOs;
using API.DTOs.Auth;
using API.Extensions;
using Application.DTOs;
using Application.Features.Auth.Commands;
using FastEndpoints;
using MediatR;

namespace API.Endpoints.Auth;

public class LoginEndpoint : Endpoint<LoginRequest, ApiSuccessResponse<AuthTokenResponse>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Post("/api/auth/login");
        AllowAnonymous();
        Options(x => x.RequireRateLimiting("auth_strict"));
        Summary(s =>
        {
            s.Summary = "Login with email and password";
            s.Description = "Verifies credentials against 'Local' UserAuthProvider. Returns JWT access token; refresh token is set as HttpOnly cookie.";
        });
    }

    public override async Task HandleAsync(LoginRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new LoginCommand(req.Email, req.Password), ct);

        if (result.IsSuccess && result.Data is not null)
        {
            HttpContext.Response.Cookies.Append("refreshToken", result.Data.RefreshToken, new CookieOptions
            {
                HttpOnly = true,
                Expires = result.Data.RefreshTokenExpiryTime,
                Secure = true,
                SameSite = SameSiteMode.Lax,
                IsEssential = true
            });
            result.Data.RefreshTokenExpiryTime = DateTime.UtcNow;
            result.Data.RefreshToken = string.Empty;
        }

        await this.SendApiResponseAsync(result, ct);
    }
}
