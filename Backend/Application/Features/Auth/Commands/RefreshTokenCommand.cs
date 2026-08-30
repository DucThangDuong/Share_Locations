using Application.Common;
using Application.Common.Interfaces;
using Application.DTOs;
using Domain.Enums;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Auth.Commands;

public record RefreshTokenCommand(string? AccessToken, string? RefreshToken) : IRequest<Result<AuthTokenResponse>>;

public class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, Result<AuthTokenResponse>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly ITokenCacheService _tokenCacheService;

    public RefreshTokenCommandHandler(
        IUnitOfWork unitOfWork,
        IJwtTokenService jwtTokenService,
        ITokenCacheService tokenCacheService)
    {
        _unitOfWork = unitOfWork;
        _jwtTokenService = jwtTokenService;
        _tokenCacheService = tokenCacheService;
    }

    public async Task<Result<AuthTokenResponse>> Handle(RefreshTokenCommand request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.AccessToken) || string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            return Result<AuthTokenResponse>.Unauthorized("Access Token hoặc Refresh Token không hợp lệ.");
        }

        var principal = _jwtTokenService.GetPrincipalFromExpiredToken(request.AccessToken);
        if (principal == null)
        {
            return Result<AuthTokenResponse>.Unauthorized("Access Token không hợp lệ.");
        }

        var userId = _jwtTokenService.GetUserIdFromToken(request.AccessToken);
        if (userId == null)
        {
            return Result<AuthTokenResponse>.Unauthorized("Không tìm thấy thông tin người dùng trong Token.");
        }

        // Validate Refresh Token against cache/redis
        var cachedRefreshToken = await _tokenCacheService.GetRefreshTokenAsync(userId.Value, ct);
        if (string.IsNullOrEmpty(cachedRefreshToken) || cachedRefreshToken != request.RefreshToken)
        {
            return Result<AuthTokenResponse>.Unauthorized("Refresh Token không hợp lệ hoặc đã hết hạn.");
        }

        var user = await _unitOfWork.Users.GetByIdWithProfileAsync(userId.Value, ct);
        if (user == null || user.Status == UserStatus.Banned || user.Status == UserStatus.Inactive)
        {
            return Result<AuthTokenResponse>.Unauthorized("Tài khoản không hợp lệ hoặc đã bị khóa.");
        }

        // Rotate Tokens
        var newAccessToken = _jwtTokenService.GenerateAccessToken(user);
        var newRefreshToken = _jwtTokenService.GenerateRefreshToken();
        var refreshTokenExpiry = DateTime.UtcNow.AddDays(7);

        await _tokenCacheService.SetRefreshTokenAsync(user.Id, newRefreshToken, TimeSpan.FromDays(7), ct);

        var response = new AuthTokenResponse
        {
            AccessToken = newAccessToken,
            RefreshToken = newRefreshToken,
            RefreshTokenExpiryTime = refreshTokenExpiry,
            User = new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.Profile?.FullName ?? user.Email,
                AvatarUrl = user.Profile?.AvatarUrl,
                Phone = user.Profile?.Phone,
                Role = user.Role,
                Status = user.Status,
                RankLevel = user.Profile?.RankLevel ?? "Tân binh",
                ReputationScore = user.Profile?.ReputationScore ?? 0
            }
        };

        return Result<AuthTokenResponse>.Success(response, "Cấp mới token thành công.");
    }
}
