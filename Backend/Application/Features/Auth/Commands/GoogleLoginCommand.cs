using Application.Common;
using Application.Common.Interfaces;
using Application.DTOs;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Auth.Commands;

public record GoogleLoginCommand(string IdToken) : IRequest<Result<AuthTokenResponse>>;

public class GoogleLoginCommandHandler : IRequestHandler<GoogleLoginCommand, Result<AuthTokenResponse>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IGoogleAuthService _googleAuthService;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly ITokenCacheService _tokenCacheService;

    public GoogleLoginCommandHandler(
        IUnitOfWork unitOfWork,
        IGoogleAuthService googleAuthService,
        IJwtTokenService jwtTokenService,
        ITokenCacheService tokenCacheService)
    {
        _unitOfWork = unitOfWork;
        _googleAuthService = googleAuthService;
        _jwtTokenService = jwtTokenService;
        _tokenCacheService = tokenCacheService;
    }

    public async Task<Result<AuthTokenResponse>> Handle(GoogleLoginCommand request, CancellationToken ct)
    {
        var googleUser = await _googleAuthService.ValidateIdTokenAsync(request.IdToken, ct);
        if (googleUser == null)
        {
            return Result<AuthTokenResponse>.Failure("Google Token không hợp lệ.");
        }

        var user = await _unitOfWork.Users.GetByGoogleIdAsync(googleUser.GoogleId, ct);
        if (user == null)
        {
            user = await _unitOfWork.Users.GetByEmailAsync(googleUser.Email, ct);
            if (user != null)
            {
                user.Profile?.SetGoogleId(googleUser.GoogleId);
                await _unitOfWork.SaveChangesAsync(ct);
            }
            else
            {
                var randomPasswordHash = Guid.NewGuid().ToString("N");
                user = new User(googleUser.Email, randomPasswordHash, UserRole.User);
                var profile = new UserProfile(
                    0,
                    googleUser.FullName,
                    avatarUrl: googleUser.PictureUrl,
                    googleId: googleUser.GoogleId);
                user.SetProfile(profile);

                await _unitOfWork.Users.AddAsync(user, ct);
                await _unitOfWork.SaveChangesAsync(ct);
            }
        }

        if (user.Status == UserStatus.Banned)
        {
            return Result<AuthTokenResponse>.Forbidden("Tài khoản của bạn đã bị khóa.");
        }

        if (user.Status == UserStatus.Inactive)
        {
            return Result<AuthTokenResponse>.Forbidden("Tài khoản của bạn chưa được kích hoạt.");
        }

        var accessToken = _jwtTokenService.GenerateAccessToken(user);
        var refreshToken = _jwtTokenService.GenerateRefreshToken();
        var refreshTokenExpiry = DateTime.UtcNow.AddDays(7);

        await _tokenCacheService.SetRefreshTokenAsync(user.Id, refreshToken, TimeSpan.FromDays(7), ct);

        var response = new AuthTokenResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            RefreshTokenExpiryTime = refreshTokenExpiry,
            User = new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.Profile?.FullName ?? user.Email,
                AvatarUrl = user.Profile?.AvatarUrl,
                CoverUrl = user.Profile?.CoverUrl,
                Bio = user.Profile?.Bio,
                Phone = user.Profile?.Phone,
                Role = user.Role,
                Status = user.Status,
                RankLevel = user.Profile?.RankLevel ?? "Tân binh",
                ReputationScore = user.Profile?.ReputationScore ?? 0
            }
        };

        return Result<AuthTokenResponse>.Success(response, "Đăng nhập Google thành công.");
    }
}
