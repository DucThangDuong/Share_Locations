using Application.Common;
using Application.Common.Interfaces;
using MediatR;

namespace Application.Features.Auth.Commands;

public record LogoutCommand(string? AccessToken, string? RefreshToken) : IRequest<Result<bool>>;

public class LogoutCommandHandler : IRequestHandler<LogoutCommand, Result<bool>>
{
    private readonly IJwtTokenService _jwtTokenService;
    private readonly ITokenCacheService _tokenCacheService;

    public LogoutCommandHandler(
        IJwtTokenService jwtTokenService,
        ITokenCacheService tokenCacheService)
    {
        _jwtTokenService = jwtTokenService;
        _tokenCacheService = tokenCacheService;
    }

    public async Task<Result<bool>> Handle(LogoutCommand request, CancellationToken ct)
    {
        if (!string.IsNullOrWhiteSpace(request.AccessToken))
        {
            var userId = _jwtTokenService.GetUserIdFromToken(request.AccessToken);
            if (userId.HasValue)
            {
                await _tokenCacheService.RemoveRefreshTokenAsync(userId.Value, ct);
            }

            var jti = _jwtTokenService.GetJtiFromToken(request.AccessToken);
            if (!string.IsNullOrWhiteSpace(jti))
            {
                await _tokenCacheService.BlacklistAccessTokenAsync(jti, TimeSpan.FromDays(1), ct);
            }
        }

        return Result<bool>.Success(true, "Đăng xuất thành công.");
    }
}
