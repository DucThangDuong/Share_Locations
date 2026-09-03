using Application.Common;
using Application.Common.Interfaces;
using Application.DTOs;
using Domain.Enums;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Auth.Commands;

public record LoginCommand(string Email, string Password) : IRequest<Result<AuthTokenResponse>>;

public class LoginCommandHandler : IRequestHandler<LoginCommand, Result<AuthTokenResponse>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly ITokenCacheService _tokenCacheService;

    public LoginCommandHandler(
        IUnitOfWork unitOfWork,
        IPasswordHasher passwordHasher,
        IJwtTokenService jwtTokenService,
        ITokenCacheService tokenCacheService)
    {
        _unitOfWork = unitOfWork;
        _passwordHasher = passwordHasher;
        _jwtTokenService = jwtTokenService;
        _tokenCacheService = tokenCacheService;
    }

    public async Task<Result<AuthTokenResponse>> Handle(LoginCommand request, CancellationToken ct)
    {
        var user = await _unitOfWork.Users.GetByEmailAsync(request.Email, ct);
        if (user == null)
        {
            return Result<AuthTokenResponse>.Failure("Email hoặc mật khẩu không chính xác.");
        }

        if (!_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
        {
            return Result<AuthTokenResponse>.Failure("Email hoặc mật khẩu không chính xác.");
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

        return Result<AuthTokenResponse>.Success(response, "Đăng nhập thành công.");
    }
}