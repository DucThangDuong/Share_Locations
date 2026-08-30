using API.DTOs;
using API.DTOs.Auth;
using API.Extensions;
using Application.Features.Auth.Commands;
using FastEndpoints;
using MediatR;

namespace API.Endpoints.Auth;

public class RegisterEndpoint : Endpoint<RegisterRequest, ApiSuccessResponse<long>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Post("/api/auth/register");
        AllowAnonymous();
        Options(x => x.RequireRateLimiting("auth_strict"));
        Summary(s =>
        {
            s.Summary = "Register a new user account";
            s.Description = "Creates a User account and UserProfile with a hashed password.";
        });
    }

    public override async Task HandleAsync(RegisterRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new RegisterCommand(req.FullName, req.Email, req.Password), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
