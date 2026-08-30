using Application.Common;
using Application.Common.Interfaces;
using Application.DTOs;
using Application.Features.Auth.Commands;
using MediatR;

namespace Application.Services;

public class AuthService : IAuthService
{
    private readonly IMediator _mediator;

    public AuthService(IMediator mediator)
    {
        _mediator = mediator;
    }

    public Task<Result<AuthTokenResponse>> LoginAsync(string email, string password, CancellationToken ct = default)
    {
        return _mediator.Send(new LoginCommand(email, password), ct);
    }

    public Task<Result<long>> RegisterAsync(string fullName, string email, string password, CancellationToken ct = default)
    {
        return _mediator.Send(new RegisterCommand(fullName, email, password), ct);
    }

    public Task<Result<AuthTokenResponse>> RefreshTokenAsync(string? accessToken, string? refreshToken, CancellationToken ct = default)
    {
        return _mediator.Send(new RefreshTokenCommand(accessToken, refreshToken), ct);
    }

    public Task<Result<bool>> LogoutAsync(string? accessToken, string? refreshToken, CancellationToken ct = default)
    {
        return _mediator.Send(new LogoutCommand(accessToken, refreshToken), ct);
    }

    public Task<Result<AuthTokenResponse>> GoogleLoginAsync(string idToken, CancellationToken ct = default)
    {
        return _mediator.Send(new GoogleLoginCommand(idToken), ct);
    }
}
